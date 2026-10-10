const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const IssueReport = require("../models/IssueReport");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension = allowedTypes[file.mimetype];

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(
        new Error("Only JPG, PNG, WEBP and GIF images are allowed.")
      );
    }

    callback(null, true);
  },
});

// Delete a photo if validation fails or AI rejects it.
function deleteUploadedFile(file) {
  if (file?.filename) {
    fs.unlink(
      path.join(uploadDir, file.filename),
      (error) => {
        if (error && error.code !== "ENOENT") {
          console.error("Photo cleanup failed:", error.message);
        }
      }
    );
  }
}

function parseCoordinate(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// AI verification: the image must visibly contain discarded waste.
async function verifyGarbageImage(file) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from server/.env");
  }

  // Dynamically import the ESM SDK from this CommonJS route file.
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const imageBuffer = await fs.promises.readFile(file.path);

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",

    contents: [
      {
        inlineData: {
          mimeType: file.mimetype,
          data: imageBuffer.toString("base64"),
        },
      },
      {
        text: `
You are an image verifier for a public waste-management
and garbage complaint application.

Determine whether this image clearly shows discarded garbage
or waste at a location.

ACCEPT examples:
- Garbage dumped on a road or roadside.
- A pile of household waste.
- Litter scattered on the ground.
- An overflowing public or household garbage bin.
- Visible discarded plastic, wrappers, bottles or other rubbish
  accumulated as litter or dumped waste.

REJECT examples:
- Selfies or photos of people.
- Pets and animals.
- Landscapes, plants, skies or scenery.
- Documents, screenshots, drawings or illustrations.
- Clean rooms, clean roads or clean surroundings.
- Unrelated objects or products.
- A clean recyclable item shown by itself without discarded waste.

Do not assume garbage is present just because the user says so.
Judge only what is visibly shown in the image.
If the image is unclear or uncertain, reject it.

Return JSON only in this exact structure:
{
  "isGarbage": false,
  "confidence": 0,
  "reason": "Short explanation"
}

isGarbage must be a boolean.
confidence must be a number from 0 to 100.
          `,
      },
    ],

    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  if (!response.text) {
    throw new Error("AI returned an empty response.");
  }

  let result;

  try {
    result = JSON.parse(response.text);
  } catch {
    throw new Error("AI returned an invalid response.");
  }

  const confidence = Number(result.confidence);

  // Reject uncertain, malformed or negative classifications.
  if (
    result.isGarbage !== true ||
    !Number.isFinite(confidence) ||
    confidence < 70
  ) {
    return {
      accepted: false,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      reason:
        typeof result.reason === "string"
          ? result.reason
          : "Garbage was not verified.",
    };
  }

  return {
    accepted: true,
    confidence,
    reason:
      typeof result.reason === "string"
        ? result.reason
        : "Garbage detected.",
  };
}

// GET /api/issues
// Admin sees all reports; users see only their own.
router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { reporterId: req.user.id };

    const reports = await IssueReport.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Fetch issue reports:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch issue reports.",
    });
  }
});

// POST /api/issues
// Validate the uploaded photo BEFORE saving the report.
router.post("/", protect, (req, res) => {
  upload.single("photo")(req, res, async (uploadError) => {
    if (uploadError) {
      deleteUploadedFile(req.file);

      if (uploadError instanceof multer.MulterError) {
        const message =
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "Photo must be 5 MB or smaller."
            : uploadError.message;

        return res.status(400).json({
          success: false,
          message,
        });
      }

      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    try {
      const category =
        typeof req.body.category === "string"
          ? req.body.category.trim()
          : "";

      const description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";

      const address =
        typeof req.body.address === "string"
          ? req.body.address.trim()
          : "";

      const { latitude, longitude } = req.body;

      if (!category || !description) {
        deleteUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Category and description are required.",
        });
      }

      if (category.length > 100 || description.length > 5000) {
        deleteUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Category or description is too long.",
        });
      }

      const lat = parseCoordinate(latitude);
      const lng = parseCoordinate(longitude);

      if (
        (lat !== null && (lat < -90 || lat > 90)) ||
        (lng !== null && (lng < -180 || lng > 180))
      ) {
        deleteUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Invalid location coordinates.",
        });
      }

      if ((lat === null) !== (lng === null)) {
        deleteUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Both latitude and longitude are required together.",
        });
      }

      const hasCoordinates = lat !== null && lng !== null;

      if (!address && !hasCoordinates) {
        deleteUploadedFile(req.file);

        return res.status(400).json({
          success: false,
          message: "Please provide an address or map location.",
        });
      }

      // STEP 1: If a photo was uploaded, classify it using AI.
      // If verification fails, no report will be created.
      if (req.file) {
        let detection;

        try {
          detection = await verifyGarbageImage(req.file);
        } catch (aiError) {
          console.error(
            "Garbage image verification failed:",
            aiError.message
          );

          deleteUploadedFile(req.file);

          return res.status(503).json({
            success: false,
            message:
              "Image verification is temporarily unavailable. Your report was not submitted. Please try again.",
          });
        }

        // STEP 2: Reject unrelated images and remove the uploaded file.
        if (!detection.accepted) {
          deleteUploadedFile(req.file);

          return res.status(422).json({
            success: false,
            message:
              "AI could not verify garbage in this photo. Please upload a clear image showing dumped garbage, litter or a waste pile.",
            detection: {
              isGarbage: false,
              confidence: detection.confidence,
              reason: detection.reason,
            },
          });
        }

        console.log(
          `Garbage verified. Confidence: ${detection.confidence}%`
        );
      }

      // STEP 3: Only now create the report in MongoDB.
      const report = await IssueReport.create({
        category,
        description,
        address,
        latitude: lat,
        longitude: lng,

        // Never trust a reporter ID supplied by the browser.
        reporterId: req.user.id,

        photoName: req.file?.originalname || "",
        photoUrl: req.file ? `/uploads/${req.file.filename}` : "",
      });

      return res.status(201).json({
        success: true,
        message: "Issue report saved successfully.",
        data: report,
      });
    } catch (error) {
      deleteUploadedFile(req.file);

      console.error("Create issue report:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to create issue report.",
      });
    }
  });
});

// PATCH /api/issues/:id/status
// Only admins can change a report status.
router.patch(
  "/:id/status",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID.",
        });
      }

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Resolved",
      ];

      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report status.",
        });
      }

      const report = await IssueReport.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found.",
        });
      }

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("Update report:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to update report.",
      });
    }
  }
);

// DELETE /api/issues/:id
// Only admins can delete reports.
router.delete(
  "/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID.",
        });
      }

      const report = await IssueReport.findByIdAndDelete(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found.",
        });
      }

      if (report.photoUrl) {
        const filename = path.basename(report.photoUrl);

        fs.unlink(
          path.join(uploadDir, filename),
          (error) => {
            if (error && error.code !== "ENOENT") {
              console.error("Photo deletion failed:", error.message);
            }
          }
        );
      }

      return res.json({
        success: true,
        message: "Issue report deleted successfully.",
      });
    } catch (error) {
      console.error("Delete issue report:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to delete issue report.",
      });
    }
  }
);

module.exports = router;