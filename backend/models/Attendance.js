const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    required: true,
    default: "present",
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200,
    default: "",
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String, // stored as "YYYY-MM-DD"
      required: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: [attendanceRecordSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// One attendance entry per date+class+teacher
attendanceSchema.index({ date: 1, class: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
