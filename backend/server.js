// The Express application (same order as Lab 4 and Lab 5)
require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Log every request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// CORS: only our frontend may call the API (Lab 5)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8080')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins
}));

// Read JSON bodies into req.body
app.use(express.json());

// Root route and health check (Lab 5)
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Community Garden Plots API',
    endpoints: ['/api/health', '/api/plots', '/api/tools', '/api/duties']
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Routes: one line per router
app.use('/api/auth', require('./routes/auth'));                  // Moaaz
app.use('/api/users', require('./routes/users'));                // Moaaz
app.use('/api/plots', require('./routes/plots'));                // Moaaz
app.use('/api/applications', require('./routes/applications'));  // Moaaz
app.use('/api/tools', require('./routes/tools'));                // Mayan
app.use('/api/loans', require('./routes/loans'));                // Mayan
app.use('/api/duties', require('./routes/duties'));              // Mahmoud
app.use('/api/audit-logs', require('./routes/auditLogs'));       // Mahmoud

// Route not found
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found.' }
  });
});

// Error handler (4 parameters, registered last)
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON.' }
    });
  }
  console.error(error);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' }
  });
});

app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`Community Garden API listening on http://localhost:${PORT} (${env})`);
});

module.exports = app;
