const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String },
  sizeBytes: { type: Number, default: 0 },
  kind: { type: String, enum: ['spreadsheet', 'document'], default: 'spreadsheet' },
  sheets: [{
    name: { type: String, required: true },
    columns: [{ type: String }],
    rowCount: { type: Number, default: 0 },
    rows: { type: mongoose.Schema.Types.Mixed, default: [] },
  }],
  text: { type: String, default: '' },
  charCount: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, default: 'Untitled project' },
  description: { type: String, default: '' },
  responseMode: { type: String, enum: ['short', 'detailed'], default: 'short' },
  responseSpeed: { type: String, enum: ['fast', 'medium', 'deep'], default: 'fast' },
  instructions: { type: String, default: '', maxlength: 4000 },
  sources: [sourceSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

projectSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
