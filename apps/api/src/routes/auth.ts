import { db } from '@base0/db';
import { hashPassword, verifyPassword } from '@base0/db/auth';
import { users } from '@base0/db/schema';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt';
import { authMiddleware, getAuthUser } from '../middleware/auth';

const auth = new Hono();

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

    if (!user) {
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

export default auth;
