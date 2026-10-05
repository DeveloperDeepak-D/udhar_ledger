const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: mongoose.Schema.Types.String, 
        required: true, 
        trim: true 
    },
    // Kitni baar ye item use hua hai, isse popular items ko upar dikhane mein madad milegi
    frequency: { 
        type: Number, 
        default: 1 
    }
}, { timestamps: true });

// Ek hi user ke liye ek naam ka item dobara duplicate na ho, isliye compound index banate hain
itemSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema);