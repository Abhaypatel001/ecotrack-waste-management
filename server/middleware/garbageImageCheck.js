import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";

async function removeUploadedFile(file) {
  if (file?.path) {
    await fs.unlink(file.path).catch(() => {});
  }
}

export async function garbageImageCheck(req, res, next) {
  // Agar photo hi nahi bheji gayi, existing route ka validation
  // decide karega ki photo required hai ya nahi.
  if (!req.file) {
    return next();
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      await removeUploadedFile(req.file);

      return res.status(503).json({
        message: "Garbage image verification is not configured.",
      });
    }

    if (!req.file.mimetype?.startsWith("image/")) {
      await removeUploadedFile(req.file);

      return res.status(422).json({
        message: "Please upload an image of garbage or waste.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const imageBuffer = req.file.buffer
      ? req.file.buffer
      : await fs.readFile(req.file.path);

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: imageBuffer.toString("base64"),
          },
        },
        {
          text: `
You are an image verifier for a waste-management complaint system.

Decide whether the image clearly shows discarded garbage or waste,
such as litter on the ground, a garbage pile, dumped waste,
scattered trash, or an overflowing garbage bin.

Reject images showing people, selfies, pets, scenery, documents,
screenshots, clean places, or unrelated objects.

A photo of a single clean product or recyclable item alone is not
enough. Accept only when discarded waste is clearly visible.
If uncertain, reject it.

Return ONLY valid JSON in this exact format:
{
  "isGarbage": true,
  "confidence": 95,
  "reason": "Visible dumped household waste"
}

"isGarbage" must be true or false.
"confidence" must be an integer from 0 to 100.
          `,
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const result = JSON.parse(response.text);

    // Conservative check: uncertain images are rejected.
    if (result.isGarbage !== true || result.confidence < 70) {
      await removeUploadedFile(req.file);

      return res.status(422).json({
        message:
          "This image does not clearly show garbage. Please upload a clear photo of the waste or garbage location.",
        detection: {
          isGarbage: false,
          reason: result.reason || "Garbage was not verified.",
        },
      });
    }

    // Only verified images reach the issue-report route handler.
    req.garbageDetection = {
      isGarbage: true,
      confidence: result.confidence,
      reason: result.reason || "Garbage detected",
    };

    next();
  } catch (error) {
    console.error("Garbage image verification failed:", error.message);

    // Fail closed: if verification fails, do not create a report.
    await removeUploadedFile(req.file);

    return res.status(503).json({
      message:
        "Image verification is temporarily unavailable. Please try again.",
    });
  }
}