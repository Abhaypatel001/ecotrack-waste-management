
const mongoose = require("mongoose");

const issueReportSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    reporterId: {
  type: String,
  default: "",
  index: true,
},
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    photoName: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IssueReport", issueReportSchema);
