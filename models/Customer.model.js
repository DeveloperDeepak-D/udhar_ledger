const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    openingBalance: {
        type: Number,
        default: 0 // Purana Udhar
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);