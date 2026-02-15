const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['ingestion', 'topics', 'script', 'storyboard', 'metadata', 'complete'],
    default: 'ingestion'
  },
  dataSource: {
    type: { type: String, enum: ['csv', 'images', 'manual'] },
    rawData: mongoose.Schema.Types.Mixed
  },
  selectedTopic: {
    id: String,
    title: String,
    finalizedAt: Date
  },
  selectedScript: {
    id: String,
    content: String,
    format: { type: String, enum: ['facecam', 'faceless'] }
  },
  selectedStoryboard: {
    scenes: [mongoose.Schema.Types.Mixed],
    format: String
  },
  selectedMetadata: {
    title: String,
    description: String,
    tags: [String],
    thumbnailPrompt: String,
    thumbnailConcept: String,
    thumbnailLayout: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now, index: true }
});

// Update timestamp on save
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
