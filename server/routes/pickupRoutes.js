const express = require("express");
const mongoose = require("mongoose");

const PickupRequest = require("../models/PickupRequest");
const User = require("../models/User");

const {
  protect,
  allowRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

const allowedStatuses = [
  "Pending",
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

// Validate YYYY-MM-DD and reject impossible dates.
function validDate(date) {
  if (typeof date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function validObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function makePickupCode() {
  return `ET-${Date.now()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

function isValidWeight(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

function sendValidationError(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

// ------------------------------------------------------
// GET /api/pickups
// Admin: all requests
// User: only their own requests
// ------------------------------------------------------
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const pickups = await PickupRequest.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pickups.length,
      data: pickups,
    });
  } catch (error) {
    console.error("Fetch pickups:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pickup requests.",
    });
  }
});

// ------------------------------------------------------
// POST /api/pickups
// Create a new pickup
// ------------------------------------------------------
router.post(
  "/",
  protect,
  allowRoles("user", "admin"),
  async (req, res) => {
    try {
      const body = req.body || {};

      const type =
        typeof body.type === "string" ? body.type.trim() : "";

      const date =
        typeof body.date === "string" ? body.date.trim() : "";

      const time =
        typeof body.time === "string" ? body.time.trim() : "";

      const address =
        typeof body.address === "string" ? body.address.trim() : "";

      const notes =
        typeof body.notes === "string" ? body.notes.trim() : "";

      if (!type || !date || !time || !address) {
        return sendValidationError(
          res,
          "Waste type, date, time and address are required."
        );
      }

      if (type.length > 100) {
        return sendValidationError(
          res,
          "Waste type must be 100 characters or fewer."
        );
      }

      if (!validDate(date)) {
        return sendValidationError(
          res,
          "Please provide a valid date in YYYY-MM-DD format."
        );
      }

      const today = new Date().toISOString().slice(0, 10);

      if (date < today) {
        return sendValidationError(
          res,
          "Pickup date cannot be in the past."
        );
      }

      if (time.length > 100) {
        return sendValidationError(
          res,
          "Pickup time must be 100 characters or fewer."
        );
      }

      if (address.length > 500) {
        return sendValidationError(
          res,
          "Address must be 500 characters or fewer."
        );
      }

      if (notes.length > 2000) {
        return sendValidationError(
          res,
          "Notes must be 2000 characters or fewer."
        );
      }

      // Users are always assigned to their own pickup.
      let ownerId = req.user.id;

      // Admin-created requests can be assigned to a user
      // or left unassigned.
      if (req.user.role === "admin") {
        if (body.userId) {
          if (!validObjectId(body.userId)) {
            return sendValidationError(res, "Invalid user ID.");
          }

          const targetUser = await User.findById(body.userId).select("_id");

          if (!targetUser) {
            return res.status(404).json({
              success: false,
              message: "The selected user was not found.",
            });
          }

          ownerId = targetUser._id;
        } else {
          ownerId = null;
        }
      }

      const pickup = await PickupRequest.create({
        pickupCode: makePickupCode(),
        userId: ownerId,
        type,
        date,
        time,
        address,
        notes,
        status: "Scheduled",
        collectedWeightKg: null,
      });

      const savedPickup = await PickupRequest.findById(pickup._id)
        .populate("userId", "name email");

      return res.status(201).json({
        success: true,
        message: "Pickup request created successfully.",
        data: savedPickup,
      });
    } catch (error) {
      console.error("Create pickup:", error);

      if (
        error.name === "ValidationError" ||
        error.name === "CastError"
      ) {
        return sendValidationError(res, error.message);
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create pickup request.",
      });
    }
  }
);

// ------------------------------------------------------
// PATCH /api/pickups/:id/status
// Admin only: update status
// ------------------------------------------------------
router.patch(
  "/:id/status",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};

      if (!validObjectId(id)) {
        return sendValidationError(res, "Invalid pickup ID.");
      }

      if (!allowedStatuses.includes(status)) {
        return sendValidationError(res, "Invalid pickup status.");
      }

      const pickup = await PickupRequest.findByIdAndUpdate(
        id,
        { $set: { status } },
        {
          returnDocument: "after",
          runValidators: true,
        }
      ).populate("userId", "name email");

      if (!pickup) {
        return res.status(404).json({
          success: false,
          message: "Pickup request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pickup status updated successfully.",
        data: pickup,
      });
    } catch (error) {
      console.error("Update pickup status:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update pickup status.",
      });
    }
  }
);

// ------------------------------------------------------
// PATCH /api/pickups/:id
// Admin only: update any supplied fields.
//
// IMPORTANT:
// This is a partial update. It does not require type,
// date, time and address when updating weight alone.
// ------------------------------------------------------
router.patch(
  "/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body || {};

      if (!validObjectId(id)) {
        return sendValidationError(res, "Invalid pickup ID.");
      }

      const pickup = await PickupRequest.findById(id);

      if (!pickup) {
        return res.status(404).json({
          success: false,
          message: "Pickup request not found.",
        });
      }

      let hasChanges = false;

      // Update waste type only if supplied.
      if (body.type !== undefined) {
        if (typeof body.type !== "string" || !body.type.trim()) {
          return sendValidationError(res, "Waste type is required.");
        }

        const type = body.type.trim();

        if (type.length > 100) {
          return sendValidationError(
            res,
            "Waste type must be 100 characters or fewer."
          );
        }

        pickup.type = type;
        hasChanges = true;
      }

      // Update date only if supplied.
      // Past dates are permitted when correcting an existing record.
      if (body.date !== undefined) {
        if (!validDate(body.date)) {
          return sendValidationError(
            res,
            "Please provide a valid date in YYYY-MM-DD format."
          );
        }

        pickup.date = body.date;
        hasChanges = true;
      }

      if (body.time !== undefined) {
        if (typeof body.time !== "string" || !body.time.trim()) {
          return sendValidationError(res, "Pickup time is required.");
        }

        const time = body.time.trim();

        if (time.length > 100) {
          return sendValidationError(
            res,
            "Pickup time must be 100 characters or fewer."
          );
        }

        pickup.time = time;
        hasChanges = true;
      }

      if (body.address !== undefined) {
        if (typeof body.address !== "string" || !body.address.trim()) {
          return sendValidationError(res, "Pickup address is required.");
        }

        const address = body.address.trim();

        if (address.length > 500) {
          return sendValidationError(
            res,
            "Address must be 500 characters or fewer."
          );
        }

        pickup.address = address;
        hasChanges = true;
      }

      if (body.notes !== undefined) {
        if (typeof body.notes !== "string") {
          return sendValidationError(
            res,
            "Notes must be a text value."
          );
        }

        const notes = body.notes.trim();

        if (notes.length > 2000) {
          return sendValidationError(
            res,
            "Notes must be 2000 characters or fewer."
          );
        }

        pickup.notes = notes;
        hasChanges = true;
      }

      // Status can also be updated through this route.
      if (body.status !== undefined) {
        if (!allowedStatuses.includes(body.status)) {
          return sendValidationError(res, "Invalid pickup status.");
        }

        pickup.status = body.status;
        hasChanges = true;
      }

      // Only Admin can assign or unassign a pickup.
      if (body.userId !== undefined) {
        if (body.userId === null || body.userId === "") {
          pickup.userId = null;
        } else {
          if (!validObjectId(body.userId)) {
            return sendValidationError(res, "Invalid user ID.");
          }

          const targetUser = await User.findById(body.userId).select("_id");

          if (!targetUser) {
            return res.status(404).json({
              success: false,
              message: "The selected user was not found.",
            });
          }

          pickup.userId = targetUser._id;
        }

        hasChanges = true;
      }

      // Save actual measured weight. Other fields are not required.
      if (body.collectedWeightKg !== undefined) {
        const rawWeight = body.collectedWeightKg;

        if (rawWeight === null || String(rawWeight).trim() === "") {
          // Empty value clears the recorded weight.
          pickup.collectedWeightKg = null;
        } else {
          const weight = Number(rawWeight);

          if (!Number.isFinite(weight) || weight < 0) {
            return sendValidationError(
              res,
              "Weight must be a valid non-negative number in kilograms."
            );
          }

          const effectiveStatus = body.status ?? pickup.status;

          if (effectiveStatus !== "Completed") {
            return sendValidationError(
              res,
              "Mark the pickup as Completed before recording its weight."
            );
          }

          pickup.collectedWeightKg = weight;
        }

        hasChanges = true;
      }

      if (!hasChanges) {
        return sendValidationError(
          res,
          "No valid fields were provided to update."
        );
      }

      await pickup.save();
      await pickup.populate("userId", "name email");

      return res.status(200).json({
        success: true,
        message: "Pickup request updated successfully.",
        data: pickup,
      });
    } catch (error) {
      console.error("Edit pickup:", error);

      if (
        error.name === "ValidationError" ||
        error.name === "CastError"
      ) {
        return sendValidationError(res, error.message);
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update pickup request.",
      });
    }
  }
);

// ------------------------------------------------------
// DELETE /api/pickups/:id
// Admin: delete any pickup.
// User: delete only their own pending/scheduled pickup.
// ------------------------------------------------------
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validObjectId(id)) {
      return sendValidationError(res, "Invalid pickup ID.");
    }

    const pickup = await PickupRequest.findById(id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: "Pickup request not found.",
      });
    }

    const isAdmin = req.user.role === "admin";

    const isOwner =
      pickup.userId &&
      pickup.userId.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another user's pickup.",
      });
    }

    if (
      !isAdmin &&
      !["Pending", "Scheduled"].includes(pickup.status)
    ) {
      return sendValidationError(
        res,
        "Only pending or scheduled pickups can be cancelled."
      );
    }

    await PickupRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: isAdmin
        ? "Pickup request deleted successfully."
        : "Pickup request cancelled successfully.",
    });
  } catch (error) {
    console.error("Delete pickup:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete pickup request.",
    });
  }
});

module.exports = router;