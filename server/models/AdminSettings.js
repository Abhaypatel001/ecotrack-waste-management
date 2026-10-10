
const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      required: true,
    },
    organization: {
      type: String,
      default: "EcoTrack Waste Management",
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
    },
    serviceArea: {
      type: String,
      default: "Kanpur",
      trim: true,
      maxlength: 150,
    },
    workingHours: {
      type: String,
      default: "9:00 AM - 6:00 PM",
      trim: true,
      maxlength: 100,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pickupNotifications: {
      type: Boolean,
      default: true,
    },
    complaintNotifications: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
