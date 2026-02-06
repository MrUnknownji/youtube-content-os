const mongoose = require("mongoose");

const pinnedItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: "personal_user",
  },
  itemType: {
    type: String,
    enum: [
      "topic",
      "script",
      "storyboard",
      "title",
      "description",
      "thumbnail_concept",
    ],
    required: true,
  },
  content: mongoose.Schema.Types.Mixed,
  sourceProjectId: {
    type: String,
    ref: "Project",
  },
  pinnedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
pinnedItemSchema.index({ userId: 1, itemType: 1 });
pinnedItemSchema.index({ pinnedAt: -1 });

module.exports = mongoose.model("PinnedItem", pinnedItemSchema);
