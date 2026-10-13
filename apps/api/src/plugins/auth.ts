import type { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { getConfig } from '../config.js';

export interface AuthenticatedUser {
  id: string; // From JWT 'sub' claim (verified UUID)
  email: string;
  role?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

// Cached remote JWKS set for asymmetric production verification
let cachedJWKS: JWTVerifyGetKey | null = null;

function getJWKS(jwksUrl: string): JWTVerifyGetKey {
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(jwksUrl), {
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes cache
      cooldownDuration: 30 * 1000,  // 30 seconds cooldown between fetches
    });
  }
  return cachedJWKS;
}

/**
 * Validates Supabase-issued JWTs using the 'jose' library.
 * Verifications performed:
 * 1. Production Mode: Strictly asymmetric RS256/ES256 verified against SUPABASE_JWKS_URL.
 * 2. Development Mode: If JWKS is not configured, allows isolated HS256 with SUPABASE_JWT_SECRET.
 *    HS256 is strictly blocked in production.
 * 3. Token expiration ('exp')
 * 4. Token audience ('aud' must be 'authenticated')
 * 5. Extraction of verified user identity strictly from 'sub' claim (UUID)
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header with Bearer token',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Empty Bearer token',
      },
    });
    return;
  }

  const config = getConfig();

  try {
    let verifiedPayload: any;

    if (config.SUPABASE_JWKS_URL) {
      // Production asymmetric verification via remote JWKS
      const jwks = getJWKS(config.SUPABASE_JWKS_URL);
      const { payload } = await jwtVerify(token, jwks, {
        algorithms: ['RS256', 'ES256'],
        audience: 'authenticated',
      });
      verifiedPayload = payload;
    } else {
      // Isolated development/test fallback with symmetric HS256
      if (config.NODE_ENV === 'production') {
        reply.status(500).send({
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'Production requires asymmetric JWKS verification (SUPABASE_JWKS_URL)',
          },
        });
        return;
      }

      if (!config.SUPABASE_JWT_SECRET) {
        reply.status(500).send({
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'SUPABASE_JWT_SECRET missing for development token verification',
          },
        });
        return;
      }

      const secretKey = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey, {
        algorithms: ['HS256'],
        audience: 'authenticated',
      });
      verifiedPayload = payload;
    }

    if (!verifiedPayload.sub || typeof verifiedPayload.sub !== 'string') {
      reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token missing verified subject (sub) claim',
        },
      });
      return;
    }

    // Attach verified user identity
    request.user = {
      id: verifiedPayload.sub,
      email: (verifiedPayload.email as string) || '',
      role: (verifiedPayload.role as string) || 'authenticated',
    };
  } catch (err: any) {
    const message = err.message || 'Token verification failed';
    reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: `Authentication failed: ${message}`,
      },
    });
  }
}
