const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./src/config/db');
const limiter = require('./src/utils/rateLimiter');

const eventRoutes = require('./src/routes/eventRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(express.json());
app.use(limiter);

app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || '3001';

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is listening on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting DB: ${error}`);
  });

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Alive',
  });
});
