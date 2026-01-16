import { db } from '@base0/db';
import { hashPassword, verifyPassword } from '@base0/db/auth';
import { magicLinks, oauthAccounts, users } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { generateState } from 'arctic';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt';
import { github } from '../lib/oauth';
import { authMiddleware, getAuthUser } from '../middleware/auth';
import type { AuthVariables } from '../types';

const auth = new Hono<{ Variables: AuthVariables }>();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * POST /v1/auth/signup
 * Register a new user
 */
auth.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
      })
      .returning();

    // Generate tokens
    const accessToken = generateAccessToken(newUser.id, newUser.email);
    const refreshToken = generateRefreshToken(newUser.id, newUser.email);

    return c.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        accessToken,
        refreshToken,
      },
      201,
    );
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

/**
 * POST /v1/auth/login
 * Authenticate a user
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.passwordHash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

/**
 * POST /v1/auth/refresh
 * Refresh access token using refresh token
 */
auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    const payload = verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(payload.userId, payload.email);

    return c.json({
      accessToken: newAccessToken,
    });
  } catch (_error) {
    return c.json({ error: 'Invalid or expired refresh token' }, 401);
  }
});

/**
 * GET /v1/auth/me
 * Get current authenticated user
 */
auth.get('/me', authMiddleware, async (c) => {
  const { userId } = getAuthUser(c);

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

const magicLinkSchema = z.object({
  email: z.string().email(),
});

const verifyMagicLinkSchema = z.object({
  token: z.string(),
});

/**
 * POST /v1/auth/magic-link
 * Request a magic link
 */
auth.post('/magic-link', zValidator('json', magicLinkSchema), async (c) => {
  const { email } = c.req.valid('json');

  try {
    // Generate token
    const token = crypto.randomUUID();

    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashLogin = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashLogin));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.insert(magicLinks).values({
      tokenHash,
      userEmail: email,
      expiresAt,
    });

    console.log(`[MAGIC LINK] For ${email}: ${token}`);

    return c.json({
      message: 'Magic link sent (check console in dev)',
      token:
        !process.env.NODE_ENV ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test'
          ? token
          : undefined,
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return c.json({ error: 'Failed to request magic link' }, 500);
  }
});

/**
 * POST /v1/auth/verify-magic-link
 * Verify token and login/register
 */
auth.post('/verify-magic-link', zValidator('json', verifyMagicLinkSchema), async (c) => {
  const { token } = c.req.valid('json');

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashLogin = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashLogin));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Find valid token
    const [link] = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.tokenHash, tokenHash), eq(magicLinks.used, false)))
      .limit(1);

    if (!link || new Date() > link.expiresAt) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Mark used
    await db.update(magicLinks).set({ used: true }).where(eq(magicLinks.id, link.id));

    // Find or Create User
    let [user] = await db.select().from(users).where(eq(users.email, link.userEmail)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: link.userEmail,
          // passwordHash is null
        })
        .returning();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Magic link verify error:', error);
    return c.json({ error: 'Failed to verify magic link' }, 500);
  }
});

/**
 * GET /v1/auth/login/github
 * Start GitHub OAuth flow
 */
auth.get('/login/github', async (c) => {
  const state = generateState();
  const url = await github.createAuthorizationURL(state, ['user:email']);

  setCookie(c, 'github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'Lax',
  });

  return c.redirect(url.toString());
});

/**
 * GET /v1/auth/login/github/callback
 * Handle GitHub OAuth callback
 */
auth.get('/login/github/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'github_oauth_state');

  if (!code || !state || !storedState || state !== storedState) {
    return c.json({ error: 'Invalid state' }, 400);
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const githubUser = await githubUserResponse.json();

    // Check if existing user by provider
    const [existingAccount] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, 'github'),
          eq(oauthAccounts.providerUserId, githubUser.id.toString()),
        ),
      )
      .limit(1);

    let userId: string;

    if (existingAccount) {
      userId = existingAccount.userId;
    } else {
      // Check if email exists
      let email = githubUser.email;
      if (!email) {
        // Fallback fetch emails
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        });
        const emails = (await emailsRes.json()) as { email: string; primary: boolean }[];
        email = emails.find((e) => e.primary)?.email;
      }

      if (!email) {
        return c.json({ error: 'No email found from GitHub' }, 400);
      }

      // Find existing user by email
      const [userByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (userByEmail) {
        userId = userByEmail.id;
      } else {
        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            // passwordHash is null
          })
          .returning();
        userId = newUser.id;
      }

      // Link account
      await db.insert(oauthAccounts).values({
        provider: 'github',
        providerUserId: githubUser.id.toString(),
        userId: userId,
      });
    }

    // Get user for token generation
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Redirect to dashboard with tokens (unsafe practice for tokens in URL, usually set cookie or render generic success page with postMessage)
    // For MVP, we'll return JSON. But in a real app, this is a browser redirect.
    // Option 1: Set cookies and redirect
    // Option 2: Redirect to frontend /auth/callback?accessToken=...

    // We'll redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return c.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  } catch (e) {
    console.error('OAuth error', e);
    return c.json({ error: 'OAuth failed' }, 500);
  }
});

export default auth;
