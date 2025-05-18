// Mock implementation of winston
const format = {
  combine: jest.fn().mockReturnThis(),
  timestamp: jest.fn().mockReturnThis(),
  errors: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  printf: jest.fn().mockReturnThis()
};

const transports = {
  Console: jest.fn(),
  File: jest.fn()
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
};

const createLogger = jest.fn().mockReturnValue(logger);

module.exports = {
  format,
  transports,
  createLogger,
  addColors: jest.fn()
};
