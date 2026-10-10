
const express = require("express");
const mongoose = require("mongoose");

const CollectionSchedule = require("../models/CollectionSchedule");
const Collector = require("../models/Collector");
const WasteCategory = require("../models/WasteCategory");

const { protect, allowRoles } = require("../middleware/authMiddleware");
const AdminSettings = require("../models/AdminSettings");

const router = express.Router();

router.use(protect, allowRoles("admin"));

const scheduleStatuses = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

const collectorStatuses = ["Active", "Inactive"];

const categoryTypes = [
  "Household",
  "Organic",
  "Recyclable",
  "Plastic",
  "Electronic",
  "Hazardous",
  "Construction",
  "Other",
];

const categoryStatuses = ["Active", "Inactive"];

function sendBadRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function textField(value, label, { required = false, max = 200 } = {}) {
  if (value === undefined) return { omitted: true };

  if (typeof value !== "string") {
    return { error: `${label} must be text.` };
  }

  const result = value.trim();

  if (required && !result) {
    return { error: `${label} is required.` };
  }

  if (result.length > max) {
    return { error: `${label} must be ${max} characters or fewer.` };
  }

  return { value: result };
}

function validDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function handleValidationError(res, error) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Admin management API error:", error);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
}

async function validateCollectorId(value) {
  if (value === null || value === "") {
    return { value: null };
  }

  if (!validId(value)) {
    return { error: "Invalid collector ID." };
  }

  const collector = await Collector.findById(value).select("_id");

  if (!collector) {
    return { error: "The selected collector was not found." };
  }

  return { value: collector._id };
}

/* =====================================================
   COLLECTION SCHEDULES
   GET    /api/admin-management/schedules
   POST   /api/admin-management/schedules
   PATCH  /api/admin-management/schedules/:id
   DELETE /api/admin-management/schedules/:id
===================================================== */

// List schedules from MongoDB.
router.get("/schedules", async (req, res) => {
  try {
    const schedules = await CollectionSchedule.find({})
      .populate("collectorId", "name phone email area status")
      .sort({ date: 1, createdAt: -1 });

    return res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Create schedule.
router.post("/schedules", async (req, res) => {
  try {
    const body = req.body || {};

    const title = textField(body.title, "Schedule name", {
      required: true,
      max: 150,
    });
    const time = textField(body.time, "Collection time", {
      required: true,
      max: 50,
    });
    const area = textField(body.area, "Collection area", {
      required: true,
      max: 200,
    });

    if (title.error) return sendBadRequest(res, title.error);
    if (time.error) return sendBadRequest(res, time.error);
    if (area.error) return sendBadRequest(res, area.error);

    if (!validDateOnly(body.date)) {
      return sendBadRequest(
        res,
        "Enter a valid collection date in YYYY-MM-DD format."
      );
    }

    const status = body.status ?? "Scheduled";

    if (!scheduleStatuses.includes(status)) {
      return sendBadRequest(res, "Invalid schedule status.");
    }

    let collectorId = null;

    if (body.collectorId !== undefined) {
      const collectorResult = await validateCollectorId(body.collectorId);

      if (collectorResult.error) {
        return sendBadRequest(res, collectorResult.error);
      }

      collectorId = collectorResult.value;
    }

    const schedule = await CollectionSchedule.create({
      title: title.value,
      date: body.date,
      time: time.value,
      area: area.value,
      collectorId,
      status,
    });

    const savedSchedule = await CollectionSchedule.findById(schedule._id)
      .populate("collectorId", "name phone email area status");

    return res.status(201).json({
      success: true,
      message: "Collection schedule created successfully.",
      data: savedSchedule,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Partially update schedule fields.
router.patch("/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return sendBadRequest(res, "Invalid schedule ID.");
    }

    const schedule = await CollectionSchedule.findById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    if (body.title !== undefined) {
      const result = textField(body.title, "Schedule name", {
        required: true,
        max: 150,
      });
      if (result.error) return sendBadRequest(res, result.error);
      schedule.title = result.value;
    }

    if (body.date !== undefined) {
      if (!validDateOnly(body.date)) {
        return sendBadRequest(
          res,
          "Enter a valid date in YYYY-MM-DD format."
        );
      }
      schedule.date = body.date;
    }

    if (body.time !== undefined) {
      const result = textField(body.time, "Collection time", {
        required: true,
        max: 50,
      });
      if (result.error) return sendBadRequest(res, result.error);
      schedule.time = result.value;
    }

    if (body.area !== undefined) {
      const result = textField(body.area, "Collection area", {
        required: true,
        max: 200,
      });
      if (result.error) return sendBadRequest(res, result.error);
      schedule.area = result.value;
    }

    if (body.status !== undefined) {
      if (!scheduleStatuses.includes(body.status)) {
        return sendBadRequest(res, "Invalid schedule status.");
      }
      schedule.status = body.status;
    }

    if (body.collectorId !== undefined) {
      const result = await validateCollectorId(body.collectorId);
      if (result.error) return sendBadRequest(res, result.error);
      schedule.collectorId = result.value;
    }

    await schedule.save();
    await schedule.populate("collectorId", "name phone email area status");

    return res.json({
      success: true,
      message: "Collection schedule updated successfully.",
      data: schedule,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Delete schedule.
router.delete("/schedules/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return sendBadRequest(res, "Invalid schedule ID.");
    }

    const schedule = await CollectionSchedule.findByIdAndDelete(
      req.params.id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    return res.json({
      success: true,
      message: "Collection schedule deleted successfully.",
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

/* =====================================================
   COLLECTORS
   GET    /api/admin-management/collectors
   POST   /api/admin-management/collectors
   PATCH  /api/admin-management/collectors/:id
   DELETE /api/admin-management/collectors/:id
===================================================== */

// List collectors.
router.get("/collectors", async (req, res) => {
  try {
    const collectors = await Collector.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: collectors.length,
      data: collectors,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Create collector.
router.post("/collectors", async (req, res) => {
  try {
    const body = req.body || {};

    const name = textField(body.name, "Full name", {
      required: true,
      max: 100,
    });
    const phone = textField(body.phone, "Phone number", {
      required: true,
      max: 20,
    });
    const email = textField(body.email ?? "", "Email address", {
      max: 150,
    });
    const area = textField(body.area, "Assigned area", {
      required: true,
      max: 150,
    });
    const vehicle = textField(body.vehicle ?? "", "Vehicle number", {
      max: 50,
    });

    for (const result of [name, phone, email, area, vehicle]) {
      if (result.error) return sendBadRequest(res, result.error);
    }

    const status = body.status ?? "Active";

    if (!collectorStatuses.includes(status)) {
      return sendBadRequest(res, "Invalid collector status.");
    }

    const collector = await Collector.create({
      name: name.value,
      phone: phone.value,
      email: email.value,
      area: area.value,
      vehicle: vehicle.value,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Collector created successfully.",
      data: collector,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Update collector.
router.patch("/collectors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return sendBadRequest(res, "Invalid collector ID.");
    }

    const collector = await Collector.findById(id);

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found.",
      });
    }

    const textFields = [
      ["name", "Full name", 100],
      ["phone", "Phone number", 20],
      ["email", "Email address", 150],
      ["area", "Assigned area", 150],
      ["vehicle", "Vehicle number", 50],
    ];

    for (const [key, label, max] of textFields) {
      if (body[key] === undefined) continue;

      const result = textField(body[key], label, {
        required: ["name", "phone", "area"].includes(key),
        max,
      });

      if (result.error) return sendBadRequest(res, result.error);
      collector[key] = result.value;
    }

    if (body.status !== undefined) {
      if (!collectorStatuses.includes(body.status)) {
        return sendBadRequest(res, "Invalid collector status.");
      }
      collector.status = body.status;
    }

    await collector.save();

    return res.json({
      success: true,
      message: "Collector updated successfully.",
      data: collector,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Prevent deleting collectors still assigned to schedules.
router.delete("/collectors/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return sendBadRequest(res, "Invalid collector ID.");
    }

    const collector = await Collector.findById(id);

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found.",
      });
    }

    const assignedCount = await CollectionSchedule.countDocuments({
      collectorId: collector._id,
    });

    if (assignedCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This collector is assigned to one or more schedules. Reassign those schedules before deleting the collector.",
      });
    }

    await Collector.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Collector deleted successfully.",
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

/* =====================================================
   WASTE CATEGORIES
   GET    /api/admin-management/categories
   POST   /api/admin-management/categories
   PATCH  /api/admin-management/categories/:id
   DELETE /api/admin-management/categories/:id
===================================================== */

// List categories.
router.get("/categories", async (req, res) => {
  try {
    const categories = await WasteCategory.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Create category.
router.post("/categories", async (req, res) => {
  try {
    const body = req.body || {};

    const name = textField(body.name, "Category name", {
      required: true,
      max: 100,
    });
    const description = textField(body.description, "Description", {
      required: true,
      max: 1000,
    });

    if (name.error) return sendBadRequest(res, name.error);
    if (description.error) return sendBadRequest(res, description.error);

    if (!categoryTypes.includes(body.wasteType)) {
      return sendBadRequest(res, "Please select a valid waste type.");
    }

    const status = body.status ?? "Active";

    if (!categoryStatuses.includes(status)) {
      return sendBadRequest(res, "Invalid category status.");
    }

    const category = await WasteCategory.create({
      name: name.value,
      wasteType: body.wasteType,
      description: description.value,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Waste category created successfully.",
      data: category,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Update category.
router.patch("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!validId(id)) {
      return sendBadRequest(res, "Invalid category ID.");
    }

    const category = await WasteCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Waste category not found.",
      });
    }

    if (body.name !== undefined) {
      const result = textField(body.name, "Category name", {
        required: true,
        max: 100,
      });
      if (result.error) return sendBadRequest(res, result.error);
      category.name = result.value;
    }

    if (body.wasteType !== undefined) {
      if (!categoryTypes.includes(body.wasteType)) {
        return sendBadRequest(res, "Please select a valid waste type.");
      }
      category.wasteType = body.wasteType;
    }

    if (body.description !== undefined) {
      const result = textField(body.description, "Description", {
        required: true,
        max: 1000,
      });
      if (result.error) return sendBadRequest(res, result.error);
      category.description = result.value;
    }

    if (body.status !== undefined) {
      if (!categoryStatuses.includes(body.status)) {
        return sendBadRequest(res, "Invalid category status.");
      }
      category.status = body.status;
    }

    await category.save();

    return res.json({
      success: true,
      message: "Waste category updated successfully.",
      data: category,
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

// Delete category.
router.delete("/categories/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return sendBadRequest(res, "Invalid category ID.");
    }

    const category = await WasteCategory.findByIdAndDelete(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Waste category not found.",
      });
    }

    return res.json({
      success: true,
      message: "Waste category deleted successfully.",
    });
  } catch (error) {
    return handleValidationError(res, error);
  }
});

/* =========================================
   ADMIN SETTINGS
   GET /api/admin-management/settings
   PUT /api/admin-management/settings
========================================= */

// Load settings, creating the default document on first access.
router.get("/settings", async (req, res) => {
  try {
    const settings = await AdminSettings.findOneAndUpdate(
      { key: "global" },
      { $setOnInsert: { key: "global" } },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Load admin settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin settings.",
    });
  }
});

// Save settings to MongoDB.
router.put("/settings", async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    const stringFields = {
      organization: { label: "Organization name", max: 150 },
      email: { label: "Support email", max: 150 },
      phone: { label: "Contact phone", max: 30 },
      serviceArea: { label: "Service area", max: 150 },
      workingHours: { label: "Working hours", max: 100 },
    };

    for (const [key, rule] of Object.entries(stringFields)) {
      if (body[key] === undefined) continue;

      if (typeof body[key] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${rule.label} must be text.`,
        });
      }

      const value = body[key].trim();

      if (key === "organization" && !value) {
        return res.status(400).json({
          success: false,
          message: "Organization name is required.",
        });
      }

      if (value.length > rule.max) {
        return res.status(400).json({
          success: false,
          message: `${rule.label} must be ${rule.max} characters or fewer.`,
        });
      }

      updates[key] = value;
    }

    const booleanFields = [
      "emailNotifications",
      "pickupNotifications",
      "complaintNotifications",
    ];

    for (const key of booleanFields) {
      if (body[key] === undefined) continue;

      if (typeof body[key] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${key} must be true or false.`,
        });
      }

      updates[key] = body[key];
    }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid support email address.",
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No settings were provided to save.",
      });
    }

    const settings = await AdminSettings.findOneAndUpdate(
      { key: "global" },
      {
        $set: updates,
        $setOnInsert: { key: "global" },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully in MongoDB.",
      data: settings,
    });
  } catch (error) {
    console.error("Save admin settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save admin settings.",
    });
  }
});

module.exports = router;
