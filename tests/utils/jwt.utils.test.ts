import {
  signAccessToken,
  verifyAccessToken,
  extractTokenFromHeader,
  signInvitationToken,
  verifyInvitationToken,
} from '../../src/utils/jwt.utils';
import { UserWithoutPassword } from '../../src/types/user.types';

describe('JWT Utils', () => {
  const mockUser: UserWithoutPassword = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('signAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = signAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const anotherUser: UserWithoutPassword = {
        ...mockUser,
        id: 2,
        email: 'other@example.com',
      };

      const token1 = signAccessToken(mockUser);
      const token2 = signAccessToken(anotherUser);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid token', () => {
      const token = signAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
    });

    it('should return null for an invalid token', () => {
      const decoded = verifyAccessToken('invalid-token');

      expect(decoded).toBeNull();
    });

    it('should return null for a tampered token', () => {
      const token = signAccessToken(mockUser);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const decoded = verifyAccessToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'my-jwt-token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('my-jwt-token');

      expect(extracted).toBeNull();
    });

    it('should return null for empty string', () => {
      const extracted = extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });
  });

  describe('invitation tokens', () => {
    it('should sign and verify a valid invitation token', () => {
      const token = signInvitationToken({
        invitationId: 'inv-1',
        eventId: 'event-1',
        email: 'test@example.com',
      });

      const decoded = verifyInvitationToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.invitationId).toBe('inv-1');
      expect(decoded?.eventId).toBe('event-1');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.type).toBe('invitation');
    });

    it('should return null for an invalid invitation token', () => {
      const decoded = verifyInvitationToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});

