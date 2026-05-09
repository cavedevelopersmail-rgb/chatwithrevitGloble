const mongoose = require('mongoose');

// Single-document collection holding admin-controlled global settings.
// Keys are stored in plaintext (the DB itself is the trust boundary, same
// as the .env file). API responses NEVER return the raw key — only a
// masked preview and a "configured" flag.
const appSettingsSchema = new mongoose.Schema({
  geminiApiKey: { type: String, default: '' },
  openaiApiKey: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

appSettingsSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
