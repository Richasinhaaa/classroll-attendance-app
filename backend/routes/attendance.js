const express = require("express");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// @GET /api/attendance — list sessions
router.get("/", async (req, res) => {
  try {
    const { class: cls, date, month, year, page = 1, limit = 20 } = req.query;
    const filter = { createdBy: req.user._id };

    if (cls) filter.class = cls;
    if (date) filter.date = date;
    if (month && year) {
      filter.date = {
        $gte: `${year}-${month.padStart(2, "0")}-01`,
        $lte: `${year}-${month.padStart(2, "0")}-31`,
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sessions, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.json({ sessions, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @POST /api/attendance — create or update session
router.post("/", async (req, res) => {
  try {
    const { date, class: cls, subject, records, notes } = req.body;

    if (!date || !cls || !records) {
      return res
        .status(400)
        .json({ error: "date, class, and records are required." });
    }

    // Upsert: update if exists for that date+class+teacher
    const session = await Attendance.findOneAndUpdate(
      { date, class: cls, createdBy: req.user._id },
      { date, class: cls, subject, records, notes, createdBy: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/attendance/:id — get single session
router.get("/:id", async (req, res) => {
  try {
    const session = await Attendance.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("records.student", "name rollNumber class section");

    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @DELETE /api/attendance/:id
router.delete("/:id", async (req, res) => {
  try {
    const session = await Attendance.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ message: "Attendance session deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/attendance/student/:studentId — attendance history for one student
router.get("/student/:studentId", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {
      createdBy: req.user._id,
      "records.student": req.params.studentId,
    };
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await Attendance.find(filter).sort({ date: -1 });

    const history = sessions.map((s) => {
      const record = s.records.find(
        (r) => r.student.toString() === req.params.studentId
      );
      return {
        date: s.date,
        class: s.class,
        subject: s.subject,
        status: record?.status || "absent",
        note: record?.note || "",
      };
    });

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
