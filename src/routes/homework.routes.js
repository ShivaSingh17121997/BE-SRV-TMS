const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/', homeworkController.createHomework);
router.get('/', homeworkController.getAllHomework);
router.patch('/:id', homeworkController.updateHomework);
router.delete('/:id', homeworkController.deleteHomework);

module.exports = router;
