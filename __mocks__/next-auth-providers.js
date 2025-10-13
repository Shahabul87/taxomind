// Mock for next-auth providers
const mockProvider = jest.fn(() => ({
  id: 'mock-provider',
  name: 'Mock Provider',
  type: 'oauth',
}));

// Default export for individual provider imports
module.exports = mockProvider;

// Named exports for when importing multiple providers
module.exports.Google = mockProvider;
module.exports.GitHub = mockProvider;
module.exports.Github = mockProvider;
module.exports.Credentials = mockProvider;
module.exports.default = mockProvider;