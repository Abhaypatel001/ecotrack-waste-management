
const mongoose = require("mongoose");

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const collectionScheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isValidDateOnly,
        message: "Enter a valid date in YYYY-MM-DD format.",
      },
    },
    time: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
      default: null,
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

collectionScheduleSchema.index({ date: 1, status: 1 });
collectionScheduleSchema.index({ collectorId: 1 });

module.exports = mongoose.model(
  "CollectionSchedule",
  collectionScheduleSchema
);
