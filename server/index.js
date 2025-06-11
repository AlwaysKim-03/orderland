require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
}); 