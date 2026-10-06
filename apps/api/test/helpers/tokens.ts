import { SignJWT, generateKeyPair, exportJWK } from 'jose';
import { getConfig } from '../../src/config.js';

export interface TestTokenOptions {
  secret?: string;
  expiresInSeconds?: number;
  audience?: string;
  issuer?: string;
  algorithm?: string;
  privateKey?: any;
  keyId?: string;
}

/**
 * Test-Only Synthetic Token Generator.
 * Exclusively used by automated test suites; completely excluded from application runtime.
 */
export async function createTestSignedToken(
  userId: string,
  email: string,
  options: TestTokenOptions = {}
): Promise<string> {
  const config = getConfig();
  const exp = Math.floor(Date.now() / 1000) + (options.expiresInSeconds ?? 3600);

  const jwt = new SignJWT({
    email,
    role: 'authenticated',
    app_metadata: { provider: 'email' },
  })
    .setSubject(userId)
    .setAudience(options.audience ?? 'authenticated')
    .setIssuer(options.issuer ?? `${config.SUPABASE_URL}/auth/v1`)
    .setIssuedAt()
    .setExpirationTime(exp);

  if (options.privateKey) {
    jwt.setProtectedHeader({
      alg: options.algorithm ?? 'RS256',
      typ: 'JWT',
      kid: options.keyId ?? 'test-key-1',
    });
    return await jwt.sign(options.privateKey);
  }

  const secretKey = new TextEncoder().encode(
    options.secret ?? config.SUPABASE_JWT_SECRET ?? 'test_secret_must_be_at_least_32_characters_long'
  );
  jwt.setProtectedHeader({
    alg: (options.algorithm as any) ?? 'HS256',
    typ: 'JWT',
  });
  return await jwt.sign(secretKey);
}

/**
 * Generates an in-memory RSA keypair and mock JWKS for testing asymmetric verification.
 */
export async function createTestJWKSPair() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key-1';
  jwk.alg = 'RS256';
  jwk.use = 'sig';

  return {
    privateKey,
    publicKey,
    jwks: {
      keys: [jwk],
    },
  };
}
