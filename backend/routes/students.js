const express = require("express");
const Student = require("../models/Student");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// @GET /api/students — get all students for this teacher
router.get("/", async (req, res) => {
  try {
    const { class: cls, search, page = 1, limit = 50 } = req.query;
    const filter = { createdBy: req.user._id, isActive: true };

    if (cls) filter.class = cls;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ class: 1, rollNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments(filter),
    ]);

    res.json({ students, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @POST /api/students — add a student
router.post("/", async (req, res) => {
  try {
    const student = await Student.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "Roll number already exists for this class." });
    }
    res.status(500).json({ error: err.message });
  }
});

// @POST /api/students/bulk — import multiple students
router.post("/bulk", async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "No students provided." });
    }

    const toInsert = students.map((s) => ({
      ...s,
      createdBy: req.user._id,
    }));

    const inserted = await Student.insertMany(toInsert, { ordered: false });
    res.status(201).json({ count: inserted.length, students: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message, inserted: err.insertedDocs });
  }
});

// @GET /api/students/classes — distinct class list
router.get("/classes", async (req, res) => {
  try {
    const classes = await Student.distinct("class", {
      createdBy: req.user._id,
      isActive: true,
    });
    res.json({ classes: classes.sort() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/students/:id
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @PUT /api/students/:id
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @DELETE /api/students/:id — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student removed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
