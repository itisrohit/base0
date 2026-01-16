import { describe, expect, test } from 'bun:test';
import { nanoid } from 'nanoid';

const API_URL = 'http://localhost:3001/v1';
let accessToken: string;
let projectId: string;
let apiKey: string;
let collectionId: string;
let bucketId: string;
let fileId: string;

describe('Base0 Integration Tests', () => {
  const userEmail = `test_${nanoid(5)}@example.com`;
  const userPassword = 'Password123!';

  test('1. User Signup', async () => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user.email).toBe(userEmail);
    accessToken = data.accessToken;
  });

  test('2. User Login', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.accessToken).toBeDefined();
    accessToken = data.accessToken;
  });

  test('3. Create Project', async () => {
    const res = await fetch(`${API_URL}/projects`, {
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
    const res = await fetch(`${API_URL}/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ scopes: ['read', 'write'] }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.apiKey).toBeDefined();
    apiKey = data.apiKey;
  });

  test('5. Create Collection (using JWT)', async () => {
    const res = await fetch(`${API_URL}/projects/${projectId}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        projectId,
        schemaDef: {
          fields: [
            { name: 'title', type: 'string', required: true },
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
    const res = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    expect(res.status).toBe(200);
  });

  test('7. Create Document (using API Key)', async () => {
    const res = await fetch(`${API_URL}/collections/${collectionId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: 'Test Document',
        rating: 5,
        isPublic: true,
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.document.data.title).toBe('Test Document');
  });

  test('8. List Documents with Filtering', async () => {
    const res = await fetch(
      `${API_URL}/collections/${collectionId}/documents?title[eq]=Test Document`,
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
  });

  test('9. Create Storage Bucket', async () => {
    const res = await fetch(`${API_URL}/storage/buckets`, {
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
    const formData = new FormData();
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    formData.append('file', blob, 'hello.txt');

    const res = await fetch(`${API_URL}/storage/buckets/${bucketId}/files`, {
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
    const res = await fetch(`${API_URL}/storage/buckets/${bucketId}/files/${fileId}/view`, {
      method: 'GET',
    });
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toBe('hello world');
  });
});
