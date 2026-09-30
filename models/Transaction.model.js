const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['GIVEN', 'GOT'], // GIVEN = Udhar diya (Debit), GOT = Paisa mila (Credit)
        required: true
    },
    note: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);