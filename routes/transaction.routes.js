const express = require('express');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');
const customerModel = require('../models/Customer.model');

const router = express.Router();

// 1. Naya Transaction Add Karne ki API (GIVEN / GOT)
router.post('/transactions', verifyToken, async (req, res) => {
    try {
        const { customerId, amount, type, note, date } = req.body;

        // Validation check
        if (!customerId || !amount || !type) {
            return res.status(400).json({ success: false, message: 'Customer ID, amount, and type are required!' });
        }

        if (!['GIVEN', 'GOT'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction type! Use GIVEN or GOT.' });
        }

        // Check karein customer exist karta hai ya nahi
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found!' });
        }

        const newTransaction = new Transaction({
            customerId,
            amount,
            type,
            note: note || '',
            date: date || Date.now()
        });

        const savedTransaction = await newTransaction.save();

        res.status(201).json({ 
            success: true, 
            message: 'Transaction added successfully!', 
            data: savedTransaction 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Kisi Specific Customer ki Saari Transactions (History) Nikalne ki API
router.get('/transactions/:customerId', verifyToken, async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found!' });
        }

        const transactions = await Transaction.find({ customerId }).sort({ date: -1, createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            customerName: customer.name,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;