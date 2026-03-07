const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { logger } = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const errorLogger = require('./middleware/errorLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use(requestLogger);

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/datasources', require('./routes/datasources'));
app.use('/api/persona', require('./routes/persona'));
app.use('/api/evaluation', require('./routes/evaluation'));
app.use('/api/health', require('./routes/health'));

// Error logging middleware
app.use(errorLogger);

// Global error handler middleware
app.use(errorHandler);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Global exception handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason: String(reason), promise: String(promise) });
});

module.exports = app;
