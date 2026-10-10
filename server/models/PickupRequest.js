
const mongoose = require("mongoose");

const pickupRequestSchema = new mongoose.Schema(
  {
    pickupCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // The actual owner is assigned by the backend from the JWT.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
      type: String,
      required: [true, "Waste type is required"],
      trim: true,
      maxlength: 100,
    },

    // Keep the date as YYYY-MM-DD for HTML date inputs.
    date: {
      type: String,
      required: [true, "Pickup date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format"],
    },

    time: {
      type: String,
      required: [true, "Pickup time is required"],
      trim: true,
      maxlength: 100,
    },

    address: {
      type: String,
      required: [true, "Pickup address is required"],
      trim: true,
      maxlength: 500,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Scheduled",
    },
    collectedWeightKg: {
  type: Number,
  min: 0,
  default: null,
},
  },
  {
    timestamps: true,
  }
);


pickupRequestSchema.index({ userId: 1, createdAt: -1 });
pickupRequestSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model(
  "PickupRequest",
  pickupRequestSchema
);
