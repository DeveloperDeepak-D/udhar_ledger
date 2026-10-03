const express = require('express');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');
const customerModel = require('../models/Customer.model');

const router = express.Router();

// 1. Token ke user ke hisaab se Naya Transaction Add Karne ki API (POST)
router.post('/transactions', verifyToken, async (req, res) => {
    try {
        const { customerId, amount, type, note, date } = req.body;
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        // Validation check
        if (!customerId || !amount || !type) {
            return res.status(400).json({ success: false, message: 'Customer ID, amount, and type are required!' });
        }

        // Support dono formats ke liye aur GIVEN/GOT mapping
        let upperType = type.toUpperCase();

        // Agar user ya app se 'GIVE' ya 'give' aaye, toh use 'GIVEN' kar do
        if (upperType === 'GIVE') {
            upperType = 'GIVEN';
        }
        // Agar user ya app se 'GET' ya 'get' aaye, toh use 'GOT' kar do
        if (upperType === 'GET') {
            upperType = 'GOT';
        }

        if (!['GIVEN', 'GOT'].includes(upperType)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction type! Use GIVEN or GOT.' });
        }

        // Check karein ki customer exist karta hai AUR wo sirf isi logged-in user ka hai
        const customer = await customerModel.findOne({ _id: customerId, userId: currentUserId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found or unauthorized!' });
        }

        const newTransaction = new Transaction({
            userId: currentUserId, // Token se aayi hui user ID yahan save hogi
            customerId,
            amount,
            type: upperType, // Ab ye hamesha 'GIVEN' ya 'GOT' hi jayega database mein
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

// 2. Specific Customer ki Saari Transactions Nikalne ki API (GET) - Securely scoped to user
router.get('/transactions/:customerId', verifyToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        // Verify karein ki customer logged-in user ka hi hai
        const customer = await customerModel.findOne({ _id: customerId, userId: currentUserId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found or unauthorized!' });
        }

        // Sirf is user ki aur is customer ki transactions fetch hongi
        const transactions = await Transaction.find({ userId: currentUserId, customerId }).sort({ date: -1, createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            customerName: customer.name,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// 3. Logged-in user ke saari transactions (sabhi customers ki) nikalne ki API (GET)
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        // Sirf is user ki saari transactions fetch hongi (sabhi customers ki mila kar)
        const transactions = await Transaction.find({ userId: currentUserId }).sort({ date: -1, createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;