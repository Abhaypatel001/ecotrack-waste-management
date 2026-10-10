
const mongoose = require("mongoose");

const collectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 150,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    vehicle: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

collectorSchema.index({ name: 1 });
collectorSchema.index({ status: 1 });

module.exports = mongoose.model("Collector", collectorSchema);
