const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Stop right away with a clear message if a required setting is missing,
// instead of starting a server that cannot log anyone in or reach the database
const missingEnv = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/error');

const app = express();

// Connect to MongoDB database
connectDB();

// Core middlewares
// Allow requests from the deployed frontend (CLIENT_URL) and localhost for development
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.replace(/\/$/, '') === o.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      const corsError = new Error('Not allowed by CORS');
      corsError.status = 403;
      return callback(corsError);
    },
    credentials: true
  })
);
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);

// Unknown routes return JSON instead of an HTML page
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start listening when this file is run directly (npm start / npm run dev).
// The tests import the app and start it on a free port themselves.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
