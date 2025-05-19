// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const vastRoutes = require('./routes/vast');
const vmapConfigRoutes = require('./routes/vmap-config');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);  

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/vast', vastRoutes);
app.use('/api/vmap-config', vmapConfigRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
