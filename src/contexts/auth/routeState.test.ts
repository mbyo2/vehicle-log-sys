import { describe, expect, test } from 'bun:test';
import { authRouteState } from './routeState';

describe('consistent sign-in and protected-route decisions', () => {
  test('a session without a profile cannot redirect to the dashboard', () => {
    expect(authRouteState({ id: 'user' }, null, false)).toBe('profile-error');
  });
  test('profile loading does not redirect to sign-in', () => {
    expect(authRouteState({ id: 'user' }, null, true)).toBe('loading');
  });
  test('a complete session can enter protected pages', () => {
    expect(authRouteState({ id: 'user' }, { role: 'company_admin' }, false)).toBe('ready');
  });
  test('signed-out users require sign-in', () => {
    expect(authRouteState(null, null, false)).toBe('signed-out');
  });
});