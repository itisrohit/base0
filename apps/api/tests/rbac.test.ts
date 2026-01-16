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

describe('Base0 RBAC & Collaboration Tests', () => {
  let ownerToken: string;
  let viewerToken: string;
  let adminToken: string;
  let projectId: string;
  let viewerUserId: string;

  const ownerEmail = `owner_${nanoid(5)}@example.com`;
  const viewerEmail = `viewer_${nanoid(5)}@example.com`;
  const adminEmail = `admin_${nanoid(5)}@example.com`;
  const password = 'Password123!';

  test('1. Setup Users', async () => {
    // Signup Owner
    const res1 = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password }),
    });
    ownerToken = (await res1.json()).accessToken;

    // Signup Viewer
    const res2 = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: viewerEmail, password }),
    });
    const vData = await res2.json();
    viewerToken = vData.accessToken;
    viewerUserId = vData.user.id;

    // Signup Admin
    const res3 = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const aData = await res3.json();
    adminToken = aData.accessToken;
  });

  test('2. Owner creates project', async () => {
    const res = await apiFetch('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name: 'RBAC Project' }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    projectId = data.project.id;
  });

  test('3. Owner invites Viewer', async () => {
    const res = await apiFetch(`/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ email: viewerEmail, role: 'viewer' }),
    });
    expect(res.status).toBe(201);
  });

  test('4. Viewer tries to create a collection (Should fail)', async () => {
    const res = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({
        name: 'Viewer Test',
        schemaDef: { fields: [{ name: 'test', type: 'string' }] },
      }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Forbidden');
  });

  test('5. Owner invites Admin', async () => {
    const res = await apiFetch(`/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ email: adminEmail, role: 'admin' }),
    });
    expect(res.status).toBe(201);
  });

  test('6. Admin creates a collection', async () => {
    const res = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Admin Test',
        schemaDef: { fields: [{ name: 'test', type: 'string' }] },
      }),
    });
    expect(res.status).toBe(201);
  });

  test('7. Admin removes Viewer', async () => {
    const res = await apiFetch(`/projects/${projectId}/members/${viewerUserId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test('8. Removed Viewer tries to list collections (Should fail)', async () => {
    const res = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
      },
    });
    expect(res.status).toBe(403);
  });
});
