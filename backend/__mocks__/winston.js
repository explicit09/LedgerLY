// Mock implementation of winston
const format = {
  combine: jest.fn(),
  timestamp: jest.fn(),
  errors: jest.fn(),
  json: jest.fn(),
  printf: jest.fn()
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
  createLogger
};
