// Pinned Items Routes - CRUD operations for pinned items
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PinnedItem = require('../models/PinnedItem');

// Connect to MongoDB if configured
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected for pins'))
    .catch(err => console.warn('⚠️ MongoDB connection failed:', err.message));
}

// GET /api/pins - Get all pinned items for user
router.get('/', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({
        success: false,
        data: null,
        fallbackUsed: true,
        message: 'MongoDB not configured'
      });
    }

    const userId = req.query.userId || 'personal_user';
    const items = await PinnedItem.find({ userId }).sort({ pinnedAt: -1 });

    res.json({
      success: true,
      data: items,
      fallbackUsed: false,
      message: 'Pinned items retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message
    });
  }
});

// POST /api/pins - Add new pinned item
router.post('/', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({
        success: false,
        data: null,
        fallbackUsed: true,
        message: 'MongoDB not configured'
      });
    }

    const item = new PinnedItem({
      ...req.body,
      userId: req.body.userId || 'personal_user'
    });
    await item.save();

    res.status(201).json({
      success: true,
      data: item,
      fallbackUsed: false,
      message: 'Item pinned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message
    });
  }
});

// DELETE /api/pins/:id - Remove pinned item
router.delete('/:id', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(503).json({
        success: false,
        data: null,
        fallbackUsed: true,
        message: 'MongoDB not configured'
      });
    }

    const item = await PinnedItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: 'Pinned item not found'
      });
    }

    res.json({
      success: true,
      data: null,
      fallbackUsed: false,
      message: 'Item unpinned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: error.message
    });
  }
});

module.exports = router;
