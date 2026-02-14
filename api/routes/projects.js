// Project Routes - CRUD operations for projects
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const checkDbConnection = require('../middleware/checkDb');

// Connect to MongoDB if configured
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.warn('⚠️ MongoDB connection failed:', err.message));
}

// Apply middleware to check DB connection for all routes
router.use(checkDbConnection);

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: projects,
      fallbackUsed: false,
      message: 'Projects retrieved successfully'
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

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project,
      fallbackUsed: false,
      message: 'Project retrieved successfully'
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

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();

    res.status(201).json({
      success: true,
      data: project,
      fallbackUsed: false,
      message: 'Project created successfully'
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

// PATCH /api/projects/:id - Update project
router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project,
      fallbackUsed: false,
      message: 'Project updated successfully'
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

// POST /api/projects/:id/finalize - Handle finalization logic
router.post('/:id/finalize', async (req, res) => {
  try {
    const { stage, data } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: 'Project not found'
      });
    }

    // Update based on stage
    switch (stage) {
      case 'topics':
        project.selectedTopic = { ...data, finalizedAt: new Date() };
        // Clear downstream selections
        project.selectedScript = null;
        project.selectedStoryboard = null;
        project.selectedMetadata = null;
        break;
      case 'script':
        project.selectedScript = data;
        project.selectedStoryboard = null;
        project.selectedMetadata = null;
        break;
      case 'storyboard':
        project.selectedStoryboard = data;
        project.selectedMetadata = null;
        break;
      case 'metadata':
        project.selectedMetadata = data;
        project.stage = 'complete';
        break;
    }

    project.stage = stage === 'metadata' ? 'complete' : stage;
    await project.save();

    res.json({
      success: true,
      data: project,
      fallbackUsed: false,
      message: `${stage} finalized successfully`
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

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        fallbackUsed: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: null,
      fallbackUsed: false,
      message: 'Project deleted successfully'
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
