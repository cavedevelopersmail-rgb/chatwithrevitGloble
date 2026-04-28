const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error('Only .xlsx, .xls, or .csv files are allowed'));
  },
});

router.get('/', auth, projectController.listProjects);
router.post('/', auth, projectController.createProject);
router.get('/:id', auth, projectController.getProject);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

router.post('/:id/sources', auth, upload.single('file'), projectController.uploadSource);
router.delete('/:id/sources/:sourceId', auth, projectController.deleteSource);

router.post('/:id/chat', auth, projectController.chat);

router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
  next();
});

module.exports = router;
