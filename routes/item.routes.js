const express = require('express');
const router = express.Router();
const Item = require('../models/Item.model');
const verifyToken = require('../middleware/auth.middleware'); // Aapka auth middleware

// Search items for auto-complete (Only for logged-in user)
router.get('/search', verifyToken, async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.id; // Token se user ID mil jayegi

        if (!query || query.trim().length === 0) {
            return res.status(200).json({ success: true, items: [] });
        }

        // Regex jo query se shuru hone wale items ko dhoondega (Case-insensitive)
        const regex = new RegExp('^' + query, 'i');
        
        const items = await Item.find({
            userId: userId,
            name: { $regex: regex }
        })
        .sort({ frequency: -1, updatedAt: -1 }) // Jo item zyada use hua hai wo upar aayega
        .limit(10); // Max 10 suggestions

        res.status(200).json({
            success: true,
            items: items.map(item => item.name) // Sirf item ke naam ki list bhej rahe hain
        });
    } catch (error) {
        console.error('Error searching items:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;