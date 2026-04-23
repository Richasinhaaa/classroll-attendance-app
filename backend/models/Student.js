const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    class: {
      type: String,
      required: [true, "Class/Section is required"],
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    guardian: {
      type: String,
      trim: true,
      default: "",
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique roll number per teacher
studentSchema.index({ rollNumber: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
