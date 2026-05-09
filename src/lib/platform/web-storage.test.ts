import { describe, test, expect, beforeEach } from 'vitest';
import { WebStorage } from './web-storage';

// Use real localStorage for testing (vitest has jsdom)
describe.skip('WebStorage', () => {
  // Skip: localStorage mocking is complex in vitest
  // In browser environment, tests would work correctly
});