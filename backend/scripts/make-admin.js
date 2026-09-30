// Promote an existing account to admin.
//
// New accounts are always teachers, so the very first admin has to be created
// outside the app. Register normally, then run (from the backend folder):
//
//   npm run make-admin -- you@example.com
//
// It uses MONGO_URI from backend/.env, or from the environment if you prefix
// the command with MONGO_URI="mongodb+srv://..." to target Atlas directly.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (add it to backend/.env).");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`No account found for ${email}. Register it first.`);
      process.exitCode = 1;
    } else {
      user.role = "admin";
      await user.save({ validateModifiedOnly: true });
      console.log(`${user.email} is now an admin.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});