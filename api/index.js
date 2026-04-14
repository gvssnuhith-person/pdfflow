/**
 * Vercel Serverless Function Entry Point
 * This bridges the Express app into the Vercel serverless environment.
 */
const app = require('../backend/src/index');

module.exports = app;
