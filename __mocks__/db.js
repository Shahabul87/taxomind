/**
 * Database Mock for Unit Tests
 */

const { prisma } = require('./prisma.js');

module.exports = {
  db: prisma,
  default: prisma,
};