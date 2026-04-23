const express = require("express");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// @GET /api/reports/summary?class=X&month=MM&year=YYYY
// Returns per-student attendance % for a class in a time range
router.get("/summary", async (req, res) => {
  try {
    const { class: cls, month, year, startDate, endDate } = req.query;

    const filter = { createdBy: req.user._id };
    if (cls) filter.class = cls;

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (month && year) {
      filter.date = {
        $gte: `${year}-${String(month).padStart(2, "0")}-01`,
        $lte: `${year}-${String(month).padStart(2, "0")}-31`,
      };
    }

    const sessions = await Attendance.find(filter);

    // Aggregate per student
    const statsMap = {};

    for (const session of sessions) {
      for (const record of session.records) {
        const sid = record.student.toString();
        if (!statsMap[sid]) {
          statsMap[sid] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        statsMap[sid][record.status] = (statsMap[sid][record.status] || 0) + 1;
        statsMap[sid].total += 1;
      }
    }

    // Attach student info
    const studentIds = Object.keys(statsMap);
    const students = await Student.find({ _id: { $in: studentIds } }).select(
      "name rollNumber class section"
    );

    const report = students.map((s) => {
      const stats = statsMap[s._id.toString()] || {};
      const pct =
        stats.total > 0
          ? (((stats.present || 0) + (stats.late || 0)) / stats.total) * 100
          : 0;
      return {
        student: s,
        stats,
        attendancePercentage: Math.round(pct * 10) / 10,
      };
    });

    report.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
    res.json({ report, totalSessions: sessions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/reports/dashboard — quick stats for logged-in teacher
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7); // "YYYY-MM"

    const [totalStudents, todaySessions, monthSessions] = await Promise.all([
      Student.countDocuments({ createdBy: req.user._id, isActive: true }),
      Attendance.find({ createdBy: req.user._id, date: today }),
      Attendance.find({
        createdBy: req.user._id,
        date: { $gte: `${thisMonth}-01`, $lte: `${thisMonth}-31` },
      }),
    ]);

    // Today's attendance rate
    let todayPresent = 0;
    let todayTotal = 0;
    for (const s of todaySessions) {
      for (const r of s.records) {
        todayTotal++;
        if (r.status === "present" || r.status === "late") todayPresent++;
      }
    }

    // Classes taken this month
    const classesThisMonth = new Set(monthSessions.map((s) => s.class)).size;

    // Low attendance students (< 75%)
    const statsMap = {};
    for (const session of monthSessions) {
      for (const r of session.records) {
        const sid = r.student.toString();
        if (!statsMap[sid]) statsMap[sid] = { present: 0, total: 0 };
        if (r.status === "present" || r.status === "late") statsMap[sid].present++;
        statsMap[sid].total++;
      }
    }

    const lowAttendance = Object.values(statsMap).filter(
      (s) => s.total > 0 && s.present / s.total < 0.75
    ).length;

    res.json({
      totalStudents,
      todayAttendanceRate:
        todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : null,
      classesThisMonth,
      totalSessionsThisMonth: monthSessions.length,
      lowAttendanceCount: lowAttendance,
      today,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
