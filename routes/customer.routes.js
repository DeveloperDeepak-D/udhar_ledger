const express = require('express');
const Customer = require('../models/Customer.model');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Naya Customer Add Karne ki API (POST)
router.post('/customers', verifyToken, async (req, res) => {
    try {
        const { name, mobile, openingBalance } = req.body;
        
        const newCustomer = new Customer({
            name,
            mobile,
            openingBalance: openingBalance || 0
        });

        const savedCustomer = await newCustomer.save();
        res.status(201).json({ success: true, data: savedCustomer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Saare Customers ki List Nikalne ki API (GET)
router.get('/customers', verifyToken, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;