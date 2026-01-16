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

describe('Base0 Integration Tests', () => {
  let accessToken: string;
  let projectId: string;
  let apiKey: string;
  let collectionId: string;
  let _documentId: string;
  let bucketId: string;
  let fileId: string;

  const email = `test_${nanoid(5)}@example.com`;
  const password = 'Password123!';

  test('1. User Signup', async () => {
    const res = await apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user.email).toBe(email);
  });

  test('2. User Login', async () => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.accessToken).toBeDefined();
    accessToken = data.accessToken;
  });

  test('3. Create Project', async () => {
    const res = await apiFetch('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'Test Project' }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    projectId = data.project.id;
  });

  test('4. Create API Key', async () => {
    const res = await apiFetch(`/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Test API Key',
        scopes: ['read', 'write'],
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.apiKey).toBeDefined();
    apiKey = data.apiKey;
  });

  test('5. Create Collection (using JWT)', async () => {
    const res = await apiFetch(`/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Posts',
        slug: 'posts',
        schemaDef: {
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'string' },
            { name: 'rating', type: 'number' },
            { name: 'isPublic', type: 'boolean' },
          ],
        },
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    collectionId = data.collection.id;
  });

  test('6. Access Projects with API Key', async () => {
    const res = await apiFetch(`/projects/${projectId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test('7. Create Document (using API Key)', async () => {
    const res = await apiFetch(`/projects/${projectId}/collections/${collectionId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          title: 'Hello World',
          content: 'This is a test post',
          rating: 5,
          isPublic: true,
        },
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    _documentId = data.document.id;
  });

  test('8. List Documents with Filtering', async () => {
    const res = await apiFetch(
      `/projects/${projectId}/collections/${collectionId}/documents?filter[rating]=5`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.documents.length).toBeGreaterThan(0);
    expect(data.documents[0].data.rating).toBe(5);
  });

  test('9. Create Storage Bucket', async () => {
    const res = await apiFetch('/storage/buckets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        name: 'test-bucket',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    bucketId = data.bucket.id;
  });

  test('10. Upload File', async () => {
    const blob = new Blob(['Hello Base0 Storage'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'hello.txt');
    formData.append('path', 'tests/hello.txt');

    const res = await apiFetch(`/storage/buckets/${bucketId}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    fileId = data.file.id;
  });

  test('11. Download File', async () => {
    const res = await apiFetch(`/storage/buckets/${bucketId}/files/${fileId}/view`, {
      method: 'GET',
    });
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toBe('Hello Base0 Storage');
  });

  test('12. Update Project', async () => {
    const res = await apiFetch(`/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'Updated Project Name' }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.project.name).toBe('Updated Project Name');
  });

  test('13. Get Usage Telemetry', async () => {
    const res = await apiFetch(`/projects/${projectId}/usage`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.usage).toBeDefined();
  });

  test('14. Delete File', async () => {
    const res = await apiFetch(
      `/storage/buckets/${bucketId}/files/${fileId}?projectId=${projectId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    expect(res.status).toBe(200);
  });

  test('15. Delete Bucket', async () => {
    const res = await apiFetch(`/storage/buckets/${bucketId}?projectId=${projectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test('16. Delete Project', async () => {
    const res = await apiFetch(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    expect(res.status).toBe(200);

    // Verify it's gone
    const verifyRes = await apiFetch(`/projects/${projectId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    expect(verifyRes.status).toBe(404);
  });
});
