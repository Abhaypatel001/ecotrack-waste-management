
const mongoose = require("mongoose");

const wasteCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    wasteType: {
      type: String,
      required: true,
      enum: [
        "Household",
        "Organic",
        "Recyclable",
        "Plastic",
        "Electronic",
        "Hazardous",
        "Construction",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

wasteCategorySchema.index({ name: 1 });
wasteCategorySchema.index({ status: 1 });

module.exports = mongoose.model("WasteCategory", wasteCategorySchema);
