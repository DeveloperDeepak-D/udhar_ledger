const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/customer.routes');
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes'); // <-- Transaction routes import kiya
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/udhar_ledger';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Test Route
app.get('/', (req, res) => {
  res.send('Udhar Ledger API is Running...');
});

app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api', transactionRoutes); // <-- Transaction routes register kiya (/api/transactions ke liye)

// Server Start
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});