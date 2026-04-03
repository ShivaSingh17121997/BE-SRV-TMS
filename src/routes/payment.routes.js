const express = require('express');
const { createPayment, getAllPayments, getPaymentById, updatePayment } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createPayment);
router.get('/', getAllPayments);
router.get('/:id', getPaymentById);
router.patch('/:id', updatePayment);

module.exports = router;
