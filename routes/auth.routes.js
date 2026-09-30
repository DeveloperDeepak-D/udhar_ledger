const express = require('express');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User.model');

const router = express.Router();

// Helper function to generate tokens
const generateToken = (user) => {
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'default_access_secret',
    );

    return { token };
};

// 1. Shopkeeper Register API (Signup)
router.post('/register', async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;
        if(!name) return res.status(400).json({success:false, message:'Name field is required'})
        if(!email) return res.status(400).json({success:false, message:'email field is required'})
        if(!password) return res.status(400).json({success:false, message:'password field is required'})
        if(!mobile) return res.status(400).json({success:false, message:'mobile field is required'})
        
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered!' });
        }

        const newUser = new UserModel({
            name,
            email,
            mobile,
            password, 
        });

        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully!', 
            data: { id: newUser._id, name: newUser.name, email: newUser.email, mobile: newUser.mobile} 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Shopkeeper Login API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password!' });
        }

        // Compare hashed password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password!' });
        }

        // Generate Tokens
        const { token } = generateToken(user);

        res.status(200).json({ 
            success: true, 
            message: 'Login successful!', 
            token,
            data: { id: user._id, name: user.name, email: user.email, mobile: user.mobile } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// 3. Logout API
router.post('/logout', (req, res) => {
    try {
        res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully!' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;