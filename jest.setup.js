// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill fetch for jsdom environment (integration tests)
// Node.js 18+ has built-in fetch, but jsdom doesn't expose it
if (typeof global.fetch === 'undefined') {
  // Import from node:url to get Node.js global fetch
  const { fetch: nodeFetch } = globalThis
  if (nodeFetch) {
    global.fetch = nodeFetch
  }
}

// Extend Jest matchers with custom matchers
// This allows us to use .toBeInTheDocument() and other helpful assertions

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock console methods to reduce noise during testing
// TEMPORARILY DISABLED FOR DEBUGGING
// const originalWarn = console.warn
// const originalError = console.error

// beforeAll(() => {
//   console.warn = jest.fn()
//   console.error = jest.fn()
// })

// afterAll(() => {
//   console.warn = originalWarn
//   console.error = originalError
// })

// Global test utilities can be added here
global.testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'TENANT',
  emailVerified: new Date(),
  image: null
}

global.testSession = {
  user: global.testUser,
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
}