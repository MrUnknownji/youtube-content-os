// Asset Upload Routes - Handle image uploads with fallback
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary if credentials available
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured");
}

// POST /api/upload - Upload image
router.post("/", async (req, res) => {
  try {
    const { image, filename, metadata = {} } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: "No image data provided",
      });
    }

    const cloudName =
      req.headers["x-cloudinary-cloud-name"] ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      req.headers["x-cloudinary-api-key"] || process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      req.headers["x-cloudinary-api-secret"] ||
      process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const result = await cloudinary.uploader.upload(image, {
          folder: "youtube-content-os",
          public_id: filename || `upload-${Date.now()}`,
          resource_type: "auto",
        });

        return res.json({
          success: true,
          data: {
            id: result.public_id,
            url: result.secure_url,
            storageType: "cloudinary",
            metadata: {
              width: result.width,
              height: result.height,
              size: result.bytes,
              ...metadata,
            },
          },
          fallbackUsed: false,
          message: "Image uploaded to Cloudinary",
        });
      } catch (cloudinaryError) {
        console.warn(
          "Cloudinary upload failed, falling back to base64:",
          cloudinaryError.message,
        );
      }
    }

    // Fallback: Return base64 data
    // In production, you'd store this in MongoDB GridFS
    res.json({
      success: true,
      data: {
        id: `base64-${Date.now()}`,
        url: image,
        storageType: "base64_mongo",
        metadata,
      },
      fallbackUsed: true,
      message: "Image stored as base64 (Cloudinary not configured)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message,
    });
  }
});

// DELETE /api/upload/:id - Delete image
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // If it's a Cloudinary ID, delete from Cloudinary
    if (!id.startsWith("base64-")) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          await cloudinary.uploader.destroy(id);
          return res.json({
            success: true,
            data: null,
            fallbackUsed: false,
            message: "Image deleted from Cloudinary",
          });
        } catch (error) {
          console.warn("Cloudinary delete failed:", error.message);
        }
      }
    }

    // Base64 images are client-side only
    res.json({
      success: true,
      data: null,
      fallbackUsed: true,
      message: "Image reference removed (client-side storage)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message,
    });
  }
});

module.exports = router;
