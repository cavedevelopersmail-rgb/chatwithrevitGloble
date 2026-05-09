const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');

router.get('/llm-keys', auth, requireAdmin, adminController.getLlmKeys);
router.put('/llm-keys', auth, requireAdmin, adminController.updateLlmKeys);

module.exports = router;
