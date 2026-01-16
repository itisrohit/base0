/**
 * Password hashing and verification using Bun's built-in Argon2id
 * https://bun.sh/docs/api/hashing#bun-password
 */

/**
 * Hash a password using Argon2id
 * Bun automatically uses secure defaults:
 * - Algorithm: Argon2id
 * - Memory cost: 65536 KiB (64 MiB)
 * - Time cost: 2 iterations
 * - Parallelism: 1
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'argon2id',
    // Bun uses secure defaults, but you can customize if needed:
    // memoryCost: 65536, // 64 MiB
    // timeCost: 2,
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}
