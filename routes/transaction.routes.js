const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction.model');
const Item = require('../models/Item.model');
const verifyToken = require('../middleware/auth.middleware');
const customerModel = require('../models/Customer.model');

const router = express.Router();

// 1. Token ke user ke hisaab se Naya Transaction Add Karne ki API (POST)
router.post('/transactions', verifyToken, async (req, res) => {
    try {
        const { customerId, amount, type, itemName, note, date } = req.body;
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        if (!customerId || !amount || !type) {
            return res.status(400).json({ success: false, message: 'Customer ID, amount, and type are required!' });
        }

        let upperType = type.toUpperCase();

        if (upperType === 'GIVE') {
            upperType = 'GIVEN';
        }
        if (upperType === 'GET') {
            upperType = 'GOT';
        }

        if (!['GIVEN', 'GOT'].includes(upperType)) {
            return res.status(400).json({ success: false, message: 'Invalid transaction type! Use GIVEN or GOT.' });
        }

        const customer = await customerModel.findOne({ _id: customerId, userId: currentUserId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found or unauthorized!' });
        }

        const newTransaction = new Transaction({
            userId: currentUserId,
            customerId,
            amount,
            type: upperType,
            itemName: itemName ? itemName.trim() : '',
            note: note || '',
            date: date || Date.now()
        });

        let savedTransaction = await newTransaction.save();

        // 🌟 Save hote hi customer object bhi populate kar lo taaki response me poora object jaye
        savedTransaction = await savedTransaction.populate('customerId');

        if (itemName && itemName.trim() !== '') {
            await Item.findOneAndUpdate(
                { userId: currentUserId, name: itemName.trim() },
                { $inc: { frequency: 1 } },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ 
            success: true, 
            message: 'Transaction added successfully!', 
            data: savedTransaction 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Summary / Calculate API (STATIC ROUTE)
router.get('/transactions/summary', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        const { customerId, date, startDate, endDate } = req.query;

        let matchQuery = { userId: new mongoose.Types.ObjectId(currentUserId) };

        if (customerId) {
            matchQuery.customerId = new mongoose.Types.ObjectId(customerId);
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            matchQuery.date = { $gte: startOfDay, $lte: endOfDay };
        } else if (startDate && endDate) {
            matchQuery.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        const summary = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        let totalGive = 0;
        let totalGet = 0;

        summary.forEach(item => {
            const type = item._id ? item._id.toUpperCase() : '';
            if (type === 'GIVEN') {
                totalGive = item.totalAmount;
            } else if (type === 'GOT') {
                totalGet = item.totalAmount;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalGive,
                totalGet,
                netBalance: totalGive - totalGet
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Logged-in user ke saari transactions nikalne ki API (GET with Populate)
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        // 🌟 .populate('customerId') se customer ka poora object mil jayega
        const transactions = await Transaction.find({ userId: currentUserId })
            .populate('customerId')
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Specific Customer ki Saari Transactions Nikalne ki API (GET with Populate)
router.get('/transactions/:customerId', verifyToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        const customer = await customerModel.findOne({ _id: customerId, userId: currentUserId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found or unauthorized!' });
        }

        const transactions = await Transaction.find({ userId: currentUserId, customerId })
            .populate('customerId')
            .sort({ date: -1, createdAt: -1 });

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