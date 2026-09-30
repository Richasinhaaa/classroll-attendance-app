const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Every route in this file requires a valid token AND the admin role.
router.use(protect, adminOnly);

const ROLES = ["teacher", "admin"];

const isSelf = (req) => req.params.id === String(req.user._id);

// @GET /api/admin/users: all accounts, with each user's active student count
router.get("/users", async (req, res) => {
  try {
    const [users, counts] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Student.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$createdBy", count: { $sum: 1 } } },
      ]),
    ]);

    const countByUser = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json({
      users: users.map((u) => ({
        ...u.toJSON(),
        studentCount: countByUser.get(String(u._id)) || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @PATCH /api/admin/users/:id/role  body: { role: "teacher" | "admin" }
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (!ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `Role must be one of: ${ROLES.join(", ")}.` });
    }
    // Stops the last admin from accidentally locking everyone out.
    if (isSelf(req) && role !== "admin") {
      return res
        .status(400)
        .json({ error: "You can't remove your own admin role." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.role = role;
    await user.save({ validateModifiedOnly: true });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @PATCH /api/admin/users/:id/status  body: { isActive: boolean }
// Deactivated users are rejected by the `protect` middleware on their next request.
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be true or false." });
    }
    if (isSelf(req)) {
      return res
        .status(400)
        .json({ error: "You can't deactivate your own account." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.isActive = isActive;
    await user.save({ validateModifiedOnly: true });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;