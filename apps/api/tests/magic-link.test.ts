import { describe, expect, test } from 'bun:test';
import { nanoid } from 'nanoid';

const API_URL = 'http://localhost:3001/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'X-Base0-Bypass-Rate-Limit': 'true',
  } as Record<string, string>;

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}

describe('Base0 Magic Link Authentication', () => {
  const email = `magic-${nanoid()}@example.com`;
  let magicToken: string;
  let accessToken: string;

  test('1. Request Magic Link', async () => {
    const res = await apiFetch('/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    console.log('Magic Link Req Data:', data);

    expect(res.status).toBe(200);
    expect(data.message).toBeDefined();
    expect(data.token).toBeDefined(); // Only in test/dev env

    magicToken = data.token;
  });

  test('2. Verify Magic Link & Create User', async () => {
    const res = await apiFetch('/auth/verify-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: magicToken }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.accessToken).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(email);

    accessToken = data.accessToken;
  });

  test('3. Verify Token Usage (Create Project)', async () => {
    const res = await apiFetch('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'Magic Project' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.project.name).toBe('Magic Project');
  });

  test('4. Verify Magic Link Cannot Be Reused', async () => {
    const res = await apiFetch('/auth/verify-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: magicToken }),
    });

    expect(res.status).toBe(401);
  });
});
