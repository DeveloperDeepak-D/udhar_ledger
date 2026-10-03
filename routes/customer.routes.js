const express = require('express');
const Customer = require('../models/Customer.model');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Token ke user ke hisaab se naya Customer Add karein (POST)
router.post('/customers', verifyToken, async (req, res) => {
    try {
        const { name, mobile, openingBalance } = req.body;
        
        const newCustomer = new Customer({
            userId: req.userId, // Token se aayi hui logged-in user ki ID yahan save hogi
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

// 2. Sirf Token wale (Logged-in) user ke customers fetch karein (GET)
router.get('/customers', verifyToken, async (req, res) => {
    try {
        // Sirf wahi customers nikalenge jinka userId current token wale user se match karega
        const customers = await Customer.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;