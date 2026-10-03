const express = require('express');
const Customer = require('../models/Customer.model');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Token ke user ke hisaab se naya Customer Add karein (POST)
router.post('/customers', verifyToken, async (req, res) => {
    try {
        const { name, mobile, openingBalance } = req.body;
        
        // Yahan hum multiple options check kar rahe hain taaki undefined na aaye
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        const newCustomer = new Customer({
            userId: currentUserId, // Ab yahan sahi ID jayegi
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
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        const customers = await Customer.find({ userId: currentUserId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;