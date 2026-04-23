const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, role, institution });
    const token = signToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// @PATCH /api/auth/update-profile
router.patch("/update-profile", protect, async (req, res) => {
  try {
    const { name, institution } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, institution },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @PATCH /api/auth/change-password
router.patch("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res
        .status(401)
        .json({ error: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
