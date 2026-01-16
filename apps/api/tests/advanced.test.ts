import { describe, expect, test } from 'bun:test';
import { nanoid } from 'nanoid';

const API_URL = 'http://localhost:3001/v1';

async function apiFetch(path: string, options: RequestInit = {}, bypass: boolean = true) {
  const headers = {
    ...options.headers,
  } as Record<string, string>;

  if (bypass) {
    headers['X-Base0-Bypass-Rate-Limit'] = 'true';
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}

describe('Base0 Advanced Primitives: Rate Limiting & Scopes', () => {
  let accessToken: string;
  let projectId: string;
  let readOnlyKey: string;
  let writeKey: string;

  test('1. Setup User & Project', async () => {
    const email = `test_${nanoid(5)}@example.com`;
    console.log('Signing up...');
    const signup = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });
    const data = await signup.json();
    accessToken = data.accessToken;
    console.log('Signed up, creating project...');

    const projRes = await apiFetch('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'Advanced Test Project' }),
    });
    const projData = await projRes.json();
    console.log('Project created:', projData.project?.id);
    projectId = projData.project?.id;
  }, 30000);

  test('2. Generate Scoped API Keys', async () => {
    // Create Read-Only Key
    const rRes = await apiFetch(`/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Read Only Key',
        scopes: ['read'],
      }),
    });
    readOnlyKey = (await rRes.json()).apiKey;

    // Create Write Key
    const wRes = await apiFetch(`/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Write Key',
        scopes: ['write'],
      }),
    });
    writeKey = (await wRes.json()).apiKey;
  });

  test('3. Verify Scope Enforcement (Read Only)', async () => {
    // 1. Can READ project
    const readRes = await apiFetch(`/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${readOnlyKey}` },
    });
    expect(readRes.status).toBe(200);

    // 2. Cannot CREATE collection (Write scope required)
    const writeRes = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${readOnlyKey}`,
      },
      body: JSON.stringify({ name: 'fail', slug: 'fail', schemaDef: { fields: [] } }),
    });
    expect(writeRes.status).toBe(403);
    const data = await writeRes.json();
    expect(data.error).toContain('missing required scope');
  });

  test('4. Verify Scope Enforcement (Write)', async () => {
    // 1. Can CREATE collection
    const res = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${writeKey}`,
      },
      body: JSON.stringify({ name: 'success', slug: 'success', schemaDef: { fields: [] } }),
    });
    expect(res.status).toBe(201);
  });

  test('5. Verify Rate Limiting', async () => {
    // The limit is 500 per minute. We need to exceed it.
    // Batch requests to prevent ECONNRESET
    const hammerKey = writeKey;

    let rateLimited = false;
    const batchSize = 50;
    const totalRequests = 510;

    for (let i = 0; i < totalRequests; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && i + j < totalRequests; j++) {
        batch.push(
          apiFetch(
            `/projects/${projectId}`,
            {
              headers: {
                Authorization: `Bearer ${hammerKey}`,
                'X-Test-Rate-Limit': 'true',
              },
            },
            false,
          ).then((res) => res.status),
        );
      }
      const results = await Promise.all(batch);
      if (results.some((status) => status === 429)) {
        rateLimited = true;
        break;
      }
    }

    expect(rateLimited).toBe(true);
  }, 45000);
});
