// Mock for next-auth
const NextAuth = jest.fn(() => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

NextAuth.default = NextAuth;

module.exports = NextAuth;
module.exports.default = NextAuth;