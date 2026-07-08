# Base0 REST API Reference

Base0 exposes a RESTful HTTP API. All endpoints are prefixed with `/v1` and return JSON.

**Base URL:** `http://localhost:3001/v1`

---

## Quick Start: Using Your API Key

This is the primary way to use Base0 programmatically. Once you have a project and an API key (created via the Dashboard or JWT), you can do everything below with just the key.

```
X-API-Key: b0_<keyId>_<secret>
```

Your key is scoped to a single project. With it you can manage collections, documents, storage, and read project info.

### Create a Collection

Collections define a typed schema for your data. Fields are validated at runtime.

```bash
KEY="b0_lW29SdUpSIwa_wEQuDpdBWoetGT4qW2KI3V2LaOXijNfK"
PROJ="proj_DfutuOTKMYXl"

curl -s -X POST http://localhost:3001/v1/projects/$PROJ/collections \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tasks",
    "schemaDef": {
      "fields": [
        { "name": "title", "type": "string", "required": true },
        { "name": "priority", "type": "number", "required": false },
        { "name": "done", "type": "boolean", "required": false }
      ]
    }
  }'
```

### Insert a Document

Data is validated against the collection schema.

```bash
curl -s -X POST http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"data": {"title": "Buy groceries", "priority": 1, "done": false}}'
```

### Query Documents with Filters

```bash
# Filter by field value
curl -s "http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents?priority=1" \
  -H "X-API-Key: $KEY"

# Greater than, contains, in, etc.
curl -s "http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents?priority[gt]=1" \
  -H "X-API-Key: $KEY"

curl -s "http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents?title[contains]=groceries" \
  -H "X-API-Key: $KEY"

curl -s "http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents?status[in]=active,pending" \
  -H "X-API-Key: $KEY"

# Paginate and sort
curl -s "http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents?limit=10&offset=0&sort=priority&order=asc" \
  -H "X-API-Key: $KEY"
```

### Update & Delete Documents

```bash
# Partial update
curl -s -X PATCH http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents/<DOC_ID> \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"done": true}'

# Delete
curl -s -X DELETE http://localhost:3001/v1/projects/$PROJ/collections/<COL_ID>/documents/<DOC_ID> \
  -H "X-API-Key: $KEY"
```

### Upload a File

```bash
# 1. Create a bucket
curl -s -X POST http://localhost:3001/v1/storage/buckets \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "'$PROJ'", "name": "my-uploads"}'

# 2. Upload a file to the bucket
curl -s -X POST http://localhost:3001/v1/storage/buckets/<BUCKET_ID>/files \
  -H "X-API-Key: $KEY" \
  -F "file=@photo.jpg"

# 3. Download/view a file
curl -s http://localhost:3001/v1/storage/buckets/<BUCKET_ID>/files/<FILE_ID>/view -o photo.jpg
```

---

## Endpoints Reference

Everything below shows both auth options. Use `X-API-Key` for programmatic access or `Authorization: Bearer <jwt>` for user sessions.

### Project Info

```bash
GET /v1/projects/:id
```

Response:
```json
{
  "project": {
    "id": "proj_...",
    "name": "hello",
    "ownerId": "uuid",
    "config": {},
    "createdAt": "..."
  }
}
```

### Collections

```bash
# List
GET /v1/projects/:projectId/collections

# Create
POST /v1/projects/:projectId/collections
Content-Type: application/json
{
  "name": "tasks",
  "schemaDef": {
    "fields": [
      { "name": "title", "type": "string", "required": true },
      { "name": "priority", "type": "number", "required": false },
      { "name": "done", "type": "boolean", "required": false },
      { "name": "email", "type": "email", "required": false },
      { "name": "url", "type": "url", "required": false },
      { "name": "dueDate", "type": "date", "required": false },
      { "name": "metadata", "type": "json", "required": false }
    ]
  }
}

# Delete
DELETE /v1/projects/:projectId/collections/:collectionId
```

Supported field types: `string`, `number`, `boolean`, `email`, `url`, `date`, `json`

### Documents

```bash
# Create
POST /v1/projects/:projectId/collections/:collectionId/documents
Content-Type: application/json
{
  "data": { "title": "...", "priority": 1 }
}

# List (with filtering & pagination)
GET /v1/projects/:projectId/collections/:collectionId/documents
  ?limit=25
  &offset=0
  &sort=createdAt
  &order=desc
  &field=value
  &field[gt]=value
  &field[gte]=value
  &field[lt]=value
  &field[lte]=value
  &field[ne]=value
  &field[contains]=substring
  &field[in]=val1,val2

# Update (partial)
PATCH /v1/projects/:projectId/collections/:collectionId/documents/:id
Content-Type: application/json
{ "title": "Updated" }

# Delete
DELETE /v1/projects/:projectId/collections/:collectionId/documents/:id
```

### Storage

```bash
# Create bucket
POST /v1/storage/buckets
Content-Type: application/json
{
  "projectId": "proj_...",
  "name": "my-uploads",
  "maxFileSize": "10MB",
  "allowedExtensions": [".jpg", ".png"]
}

# List buckets
GET /v1/storage/buckets?projectId=proj_...

# Delete bucket (must be empty)
DELETE /v1/storage/buckets/:bucketId

# Upload file
POST /v1/storage/buckets/:bucketId/files
Content-Type: multipart/form-data
file: <binary>

# List files
GET /v1/storage/buckets/:bucketId/files

# Download file
GET /v1/storage/buckets/:bucketId/files/:fileId/view

# Delete file
DELETE /v1/storage/buckets/:bucketId/files/:fileId
```

### Members

```bash
# List members
GET /v1/projects/:projectId/members

# Invite member (JWT only, admin/owner)
POST /v1/projects/:projectId/members
Content-Type: application/json
{ "email": "user@example.com", "role": "member" }

# Update role (JWT only, admin/owner)
PATCH /v1/projects/:projectId/members/:userId
Content-Type: application/json
{ "role": "admin" }

# Remove member (JWT only, admin/owner)
DELETE /v1/projects/:projectId/members/:userId
```

Roles: `admin`, `member`, `viewer`

### API Keys

```bash
# List keys
GET /v1/projects/:projectId/keys

# Create key (JWT only, admin/owner)
POST /v1/projects/:projectId/keys
Content-Type: application/json
{ "name": "My Key", "scopes": ["read", "write"] }

# Revoke key (JWT only, admin/owner)
DELETE /v1/projects/:projectId/keys/:id
```

Scopes: `read` | `write` | `admin`

### Usage Telemetry

```bash
GET /v1/projects/:projectId/usage
```

Returns mock data:
```json
{
  "usage": {
    "requests": [ { "date": "2024-01-01", "count": 120 }, ... ],
    "storage": { "used": 450, "limit": 1000 },
    "database": { "documents": 1250, "collections": 8 }
  }
}
```

---

## Auth Endpoints (JWT — for user management)

These require email/password or OAuth. Use them when you need to create projects, manage members, or issue API keys.

### Sign Up

```bash
POST /v1/auth/signup
Content-Type: application/json
{ "email": "user@example.com", "password": "password123" }
```

Response `201`:
```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": { "id": "uuid", "email": "...", "createdAt": "..." }
}
```

### Log In

```bash
POST /v1/auth/login
Content-Type: application/json
{ "email": "user@example.com", "password": "password123" }
```

### Refresh Token

```bash
POST /v1/auth/refresh
Content-Type: application/json
{ "refreshToken": "jwt..." }
```

### Get Current User

```bash
GET /v1/auth/me
Authorization: Bearer <access_token>
```

### Magic Link (Passwordless)

```bash
POST /v1/auth/magic-link
Content-Type: application/json
{ "email": "user@example.com" }

POST /v1/auth/verify-magic-link
Content-Type: application/json
{ "token": "uuid-token" }
```

### GitHub OAuth

```bash
GET /v1/auth/login/github
```
Redirects to GitHub, then to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...`

### Projects (JWT required for management)

```bash
# List user's projects
GET /v1/projects
Authorization: Bearer <access_token>

# Create project
POST /v1/projects
Authorization: Bearer <access_token>
Content-Type: application/json
{ "name": "My Project", "config": {} }

# Update project
PATCH /v1/projects/:id
Authorization: Bearer <access_token> (owner/admin)
Content-Type: application/json
{ "name": "New Name" }

# Delete project
DELETE /v1/projects/:id
Authorization: Bearer <access_token> (owner only)
```

---

## Quick Reference: What Your Key Can Do

| Endpoint | Method | Works with API Key? |
|----------|--------|-------------------|
| `GET /v1/projects/:id` | Read project | Yes |
| `GET /v1/projects/:pid/members` | List members | Yes |
| `GET/POST /v1/projects/:pid/collections` | Manage collections | Yes |
| `DELETE /v1/projects/:pid/collections/:cid` | Delete collection | Yes (admin scope) |
| `GET/POST /v1/projects/:pid/collections/:cid/documents` | CRUD documents | Yes |
| `PATCH/DELETE /.../documents/:id` | Update/delete docs | Yes |
| `GET /v1/projects/:pid/keys` | List API keys | Yes |
| `POST /v1/storage/buckets` | Manage storage | Yes (admin scope) |
| `GET /v1/storage/buckets` | List buckets | Yes |
| `POST /.../buckets/:bid/files` | Upload files | Yes |
| `GET /.../buckets/:bid/files` | List files | Yes |
| `DELETE /.../files/:fid` | Delete files | Yes |
| `GET /v1/projects/:pid/usage` | Usage telemetry | Yes |
| `POST /v1/projects/:pid/keys` | Create API key | No (JWT only) |
| `DELETE /v1/projects/:pid/keys/:id` | Revoke key | No (JWT only) |
| `POST /v1/projects/:pid/members` | Invite member | No (JWT only) |
| `PATCH/DELETE /.../members/:uid` | Manage members | No (JWT only) |
| `POST /v1/projects` | Create project | No (JWT only) |
| `DELETE /v1/projects/:id` | Delete project | No (JWT only) |
| `POST /v1/auth/*` | Auth flows | No (uses JWT) |

---

## API Key Scopes

| Scope | What it lets you do |
|-------|-------------------|
| `read` | Read project info, list collections, read documents, list members |
| `write` | All of `read` + create/update/delete documents, create collections |
| `admin` | All of `write` + manage storage, delete collections, update project |

---

## Rate Limiting

- Window: 60 seconds
- Max: 500 requests (configurable via `RATE_LIMIT_MAX`)
- Keyed by: API Key > User ID > IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

On rate limit (`429`):
```json
{ "error": "Too Many Requests", "message": "Rate limit exceeded. Try again in 45 seconds." }
```

---

## Errors

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation failure |
| `401` | Missing or invalid auth |
| `403` | Authenticated but insufficient permissions |
| `404` | Resource not found |
| `409` | Duplicate (e.g., email exists) |
| `429` | Rate limited |
| `500` | Server error |

Validation error example:
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": { "email": ["Invalid email address"] },
    "formErrors": []
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `your-secret-key-change-in-production` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Access token expiry |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins (comma-separated) |
| `STORAGE_DRIVER` | `local` | `local` or `s3` |
| `S3_ENDPOINT` | — | S3-compatible endpoint URL |
| `S3_REGION` | `us-east-1` | S3 region |
| `S3_ACCESS_KEY_ID` | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | — | S3 secret key |
| `S3_BUCKET` | — | S3 bucket name |
| `S3_FORCE_PATH_STYLE` | `true` | Force path-style S3 URLs |
| `RATE_LIMIT_MAX` | `500` | Max requests per minute |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth client secret |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for OAuth redirects |
