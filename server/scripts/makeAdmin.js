
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();

async function makeAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing from server/.env");
    }

    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL missing from server/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.log(
        "User not found. Register this email in EcoTrack first."
      );
      return;
    }

    user.role = "admin";
    await user.save();

    console.log("Admin role assigned successfully!");
    console.log("Log out and log in again to refresh your token.");
  } catch (error) {
    console.error("Could not assign admin role:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

makeAdmin();
