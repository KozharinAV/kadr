import {
  hashToken,
  safeEqual,
} from '../src/modules/auth/application/token-hash';

describe('token hash', () => {
  it('matches an identical token and rejects a different one', () => {
    const hash = hashToken('refresh-token');

    expect(safeEqual(hash, hashToken('refresh-token'))).toBe(true);
    expect(safeEqual(hash, hashToken('other-token'))).toBe(false);
  });
});
