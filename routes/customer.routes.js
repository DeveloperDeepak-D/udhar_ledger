const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/Customer.model');
const Transaction = require('../models/Transaction.model');
const verifyToken = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Token ke user ke hisaab se naya Customer Add karein (POST)
router.post('/customers', verifyToken, async (req, res) => {
    try {
        const { name, mobile, openingBalance } = req.body;
        
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        const newCustomer = new Customer({
            userId: currentUserId,
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

// 2. Sirf Token wale (Logged-in) user ke customers fetch karein with Total Given & Got (GET)
router.get('/customers', verifyToken, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?.id || req.user?._id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, error: "Unauthorized: User ID not found from token" });
        }

        // 🌟 Aggregation Pipeline jo har customer ka totalGiven aur totalGot nikal degi
        const customers = await Customer.aggregate([
            { 
                $match: { userId: new mongoose.Types.ObjectId(currentUserId) } 
            },
            {
                $lookup: {
                    from: 'transactions', // MongoDB collection name for transactions
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'txs'
                }
            },
            {
                $addFields: {
                    totalGiven: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 'tx',
                                        cond: { $eq: ['$$tx.type', 'GIVEN'] }
                                    }
                                },
                                as: 'filteredTx',
                                in: '$$filteredTx.amount'
                            }
                        }
                    },
                    totalGot: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$txs',
                                        as: 'tx',
                                        cond: { $eq: ['$$tx.type', 'GOT'] }
                                    }
                                },
                                as: 'filteredTx',
                                in: '$$filteredTx.amount'
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalBalance: { $subtract: ['$totalGiven', '$totalGot'] }
                }
            },
            {
                $project: {
                    txs: 0 // Response ko clean rakhne ke liye temporary txs array hata rahe hain
                }
            },
            { 
                $sort: { createdAt: -1 } 
            }
        ]);

        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;