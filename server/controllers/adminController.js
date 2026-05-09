const AppSettings = require('../models/AppSettings');
const aiClients = require('../utils/aiClients');

exports.getLlmKeys = async (req, res) => {
  try {
    const status = await aiClients.getKeyStatus();
    res.json({ keys: status });
  } catch (err) {
    console.error('admin getLlmKeys error:', err);
    res.status(500).json({ error: 'Failed to load key status.' });
  }
};

exports.updateLlmKeys = async (req, res) => {
  try {
    const { geminiApiKey, openaiApiKey } = req.body || {};
    const update = { updatedAt: new Date(), updatedBy: req.userId };

    // Treat undefined as "leave unchanged"; treat empty string as "clear
    // the override and fall back to the env var".
    if (typeof geminiApiKey === 'string') update.geminiApiKey = geminiApiKey.trim();
    if (typeof openaiApiKey === 'string') update.openaiApiKey = openaiApiKey.trim();

    if (update.geminiApiKey === undefined && update.openaiApiKey === undefined) {
      return res.status(400).json({ error: 'Provide geminiApiKey and/or openaiApiKey.' });
    }

    await AppSettings.findOneAndUpdate({}, update, { upsert: true, new: true });
    aiClients.bustCache();
    const status = await aiClients.getKeyStatus();
    res.json({ ok: true, keys: status });
  } catch (err) {
    console.error('admin updateLlmKeys error:', err);
    res.status(500).json({ error: 'Failed to update keys.' });
  }
};
