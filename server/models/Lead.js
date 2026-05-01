const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50 },
    location: { type: String, trim: true, maxlength: 200 },
    source: { type: String, default: 'landing', maxlength: 60 },
    userAgent: { type: String, maxlength: 500 },
    ip: { type: String, maxlength: 80 },
  },
  { timestamps: true }
);

leadSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
