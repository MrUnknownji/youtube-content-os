// Express.js Backend for YouTube Content OS
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "x-gemini-api-key",
    "x-openai-api-key",
    "x-anthropic-api-key",
  ],
};

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Import routes
const healthRoutes = require("./routes/health");
const projectRoutes = require("./routes/projects");
const pinRoutes = require("./routes/pins");
const assetRoutes = require("./routes/assets");
const aiRoutes = require("./routes/ai");

// Use routes
app.use("/api/health", healthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/pins", pinRoutes);
app.use("/api/upload", assetRoutes);
app.use("/api/ai", aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    data: null,
    fallbackUsed: true,
    message: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    fallbackUsed: false,
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 YouTube Content OS Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
