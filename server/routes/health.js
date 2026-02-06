// Health Check Route - Returns status of all external services
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Check MongoDB connection
function checkMongoDB() {
  if (!process.env.MONGODB_URI) {
    return { status: 'disconnected', message: 'MONGODB_URI not configured' };
  }
  
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[state] || 'unknown',
    message: state === 1 ? 'MongoDB connected' : 'MongoDB not connected'
  };
}

// Check Cloudinary configuration
function checkCloudinary() {
  const hasConfig = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  
  return {
    status: hasConfig ? 'connected' : 'disconnected',
    message: hasConfig ? 'Cloudinary configured' : 'Cloudinary not configured'
  };
}

// Check AI provider configuration
function checkAI() {
  const providers = ['OPENAI', 'ANTHROPIC', 'GEMINI', 'OLLAMA'];
  const configured = providers.filter(p => {
    if (p === 'OLLAMA') return !!process.env.OLLAMA_URL;
    return !!process.env[`${p}_API_KEY`];
  });
  
  if (configured.length > 0) {
    return {
      status: 'connected',
      message: `AI providers configured: ${configured.join(', ')}`
    };
  }
  
  return {
    status: 'mock',
    message: 'No AI providers configured - using template mode'
  };
}

// GET /api/health
router.get('/', async (req, res) => {
  const mongoStatus = checkMongoDB();
  const cloudinaryStatus = checkCloudinary();
  const aiStatus = checkAI();
  
  const allHealthy = 
    mongoStatus.status === 'connected' &&
    cloudinaryStatus.status === 'connected' &&
    aiStatus.status === 'connected';

  res.json({
    success: true,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        mongodb: mongoStatus,
        cloudinary: cloudinaryStatus,
        ai: aiStatus
      },
      timestamp: new Date().toISOString()
    },
    fallbackUsed: false,
    message: allHealthy ? 'All services operational' : 'Some services in fallback mode'
  });
});

module.exports = router;
