# Backend & API Specifications
## Pomodoro Focus & App Restrictor — React Native MVP

**Version:** 1.0.0
**Date:** 2026-09-30
**Status:** Draft for Backend Development

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Authentication & Security](#4-authentication--security)
5. [API Endpoints](#5-api-endpoints)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting & Throttling](#7-rate-limiting--throttling)
8. [Data Validation](#8-data-validation)
9. [WebSocket / Real-time Communication](#9-websocket--real-time-communication)
10. [File Storage](#10-file-storage)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [API Versioning Strategy](#12-api-versioning-strategy)
13. [Monitoring & Logging](#13-monitoring--logging)
14. [Testing Strategy](#14-testing-strategy)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Client                          │
│              (React Native / Expo)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (REST + WebSocket)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway                            │
│         (Rate Limiting, SSL Termination)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  Auth    │ │  Core    │ │  Quiz    │
   │ Service  │ │ Service  │ │ Service  │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
          ┌──────────────────┐
          │   PostgreSQL     │
          │   (Primary DB)   │
          └──────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐
   │  Redis   │ │AWS S3  │ │OpenAI  │
   │ (Cache/  │ │(Files) │ │(Quiz   │
   │  Queue)  │ │        │ │ Gen)   │
   └──────────┘ └────────┘ └────────┘
```

### 1.2 Design Principles

- **RESTful API** with predictable resource-oriented URLs
- **Stateless** — each request contains all necessary auth context
- **JSON** for all request/response bodies
- **JWT-based authentication** with refresh token rotation
- **Horizontal scalability** — no server-side session state
- **Mobile-first** — payloads optimized for bandwidth-constrained networks

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js 20+ | Non-blocking I/O, large ecosystem |
| Framework | Express.js / Fastify | Fastify preferred for performance |
| ORM | Prisma | Type-safe DB access, migrations |
| Database | PostgreSQL 15+ | JSONB for flexible fields, robust |
| Cache | Redis | Session cache, rate limiting, pub/sub |
| File Storage | AWS S3 / Cloudflare R2 | Document uploads, thumbnails |
| AI/LLM | OpenAI API | Dynamic quiz generation |
| Auth | Passport.js / Auth0 | Google/Apple OAuth2 + JWT |
| Validation | Zod | Runtime schema validation |
| Testing | Vitest + Supertest | Fast, TypeScript-native |
| Deployment | Docker + AWS ECS / Railway | Containerized, auto-scaling |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│     users    │       │  study_sessions  │       │  quiz_bank   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)          │       │ id (PK)      │
│ email        │  │    │ user_id (FK)     │       │ topic_id     │
│ name         │  └───►│ goal_text        │       │ question     │
│ avatar_url   │       │ topic_id         │       │ options      │
│ created_at   │       │ target_duration  │       │ correct_index│
│ updated_at   │       │ actual_duration  │       │ explanation  │
└──────────────┘       │ distraction_count│       │ difficulty   │
                       │ quiz_score       │       │ created_at   │
                       │ total_questions  │       └──────────────┘
                       │ is_completed     │
                       │ apps_blocked     │       ┌──────────────────┐
                       │ documents        │       │  quiz_sessions   │
                       │ created_at       │       ├──────────────────┤
                       │ updated_at       │       │ id (PK)          │
                       └──────────────────┘       │ session_id (FK)  │
                                                  │ question_id (FK) │
                                                  │ selected_index   │
                                                  │ is_correct       │
                                                  │ answered_at      │
                                                  └──────────────────┘
```

### 3.2 Table Definitions

#### 3.2.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `avatar_url` | TEXT | NULLABLE | Profile picture URL |
| `auth_provider` | VARCHAR(20) | NOT NULL, DEFAULT `'email'` | `google`, `apple`, or `email` |
| `auth_provider_id` | VARCHAR(255) | NULLABLE | Provider's user ID |
| `password_hash` | VARCHAR(255) | NULLABLE | Bcrypt hash (null for OAuth) |
| `refresh_token` | TEXT | NULLABLE | Current refresh token |
| `refresh_token_expires_at` | TIMESTAMP | NULLABLE | Refresh token expiry |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Account creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Last update time |

**Indexes:**
- `UNIQUE` on `email`
- `INDEX` on `auth_provider_id`

#### 3.2.2 `study_sessions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique session identifier |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → `users.id` | Owning user |
| `goal_text` | TEXT | NOT NULL | Study goal description |
| `topic_id` | VARCHAR(50) | NOT NULL | Topic category identifier |
| `target_duration_seconds` | INTEGER | NOT NULL, CHECK > 0 | Planned focus duration |
| `actual_duration_seconds` | INTEGER | NOT NULL, DEFAULT 0 | Actual focus time |
| `distraction_attempts` | INTEGER | NOT NULL, DEFAULT 0 | Count of blocked app attempts |
| `quiz_score` | INTEGER | NOT NULL, DEFAULT 0 | Correct quiz answers |
| `total_quiz_questions` | INTEGER | NOT NULL, DEFAULT 0 | Total questions presented |
| `is_completed` | BOOLEAN | NOT NULL, DEFAULT `false` | Whether timer ran to completion |
| `apps_blocked` | JSONB | NOT NULL, DEFAULT `'[]'` | Array of blocked app identifiers |
| `documents` | JSONB | NOT NULL, DEFAULT `'[]'` | Attached document metadata |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Session start time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Last update time |

**Indexes:**
- `INDEX` on `user_id`
- `INDEX` on `topic_id`
- `INDEX` on `created_at`
- `INDEX` on `(user_id, created_at)` — for stats queries

#### 3.2.3 `quiz_bank`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique question identifier |
| `topic_id` | VARCHAR(50) | NOT NULL | Topic category |
| `question` | TEXT | NOT NULL | Question text |
| `options` | JSONB | NOT NULL | Array of 4 answer strings |
| `correct_index` | INTEGER | NOT NULL, CHECK 0–3 | Index of correct answer |
| `explanation` | TEXT | NOT NULL | Post-answer explanation |
| `difficulty` | VARCHAR(10) | NOT NULL, DEFAULT `'medium'` | `easy`, `medium`, `hard` |
| `source` | VARCHAR(20) | NOT NULL, DEFAULT `'static'` | `static` or `ai_generated` |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Creation time |

**Indexes:**
- `INDEX` on `topic_id`
- `INDEX` on `(topic_id, difficulty)`

#### 3.2.4 `quiz_sessions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique answer identifier |
| `session_id` | UUID | NOT NULL, FOREIGN KEY → `study_sessions.id` | Parent session |
| `question_id` | UUID | NOT NULL, FOREIGN KEY → `quiz_bank.id` | Question answered |
| `selected_index` | INTEGER | NOT NULL, CHECK 0–3 | User's selected answer |
| `is_correct` | BOOLEAN | NOT NULL | Whether answer was correct |
| `answered_at` | TIMESTAMP | NOT NULL, DEFAULT `NOW()` | Answer timestamp |

**Indexes:**
- `INDEX` on `session_id`
- `INDEX` on `question_id`

---

## 4. Authentication & Security

### 4.1 Authentication Flow

```
┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │ Server │          │ Google/│
│        │          │        │          │ Apple  │
└───┬────┘          └───┬────┘          └───┬────┘
    │  1. OAuth Login   │                    │
    │──────────────────►│                    │
    │                   │  2. Redirect to    │
    │                   │     Provider       │
    │                   │───────────────────►│
    │                   │                    │
    │                   │  3. Auth Code      │
    │                   │◄───────────────────│
    │                   │                    │
    │                   │  4. Exchange for   │
    │                   │     Tokens         │
    │                   │───────────────────►│
    │                   │                    │
    │                   │  5. User Profile   │
    │                   │◄───────────────────│
    │                   │                    │
    │  6. JWT + Refresh │                    │
    │◄──────────────────│                    │
    │                   │                    │
    │  7. API Calls     │                    │
    │  (Bearer Token)   │                    │
    │──────────────────►│                    │
```

### 4.2 Token Strategy

| Token | Type | Expiry | Storage | Purpose |
|-------|------|--------|---------|---------|
| Access Token | JWT | 15 minutes | Memory (client) | API authorization |
| Refresh Token | Opaque random string | 30 days | Secure storage (Keychain/Keystore) | Token renewal |

### 4.3 JWT Payload

```json
{
  "sub": "uuid-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1727654400,
  "exp": 1727655300,
  "type": "access"
}
```

### 4.4 Security Headers

All responses must include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'none'
```

### 4.5 CORS Configuration

```
Allowed Origins: https://app.pomodoro-focus.com
Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
Allowed Headers: Authorization, Content-Type, X-Request-ID
Max Age: 86400
```

---

## 5. API Endpoints

### 5.1 Base URL

```
Production:  https://api.pomodoro-focus.com/api/v1
Staging:     https://staging-api.pomodoro-focus.com/api/v1
```

### 5.2 Authentication Endpoints

#### `POST /auth/register`

Create a new account with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecureP@ss123"
}
```

**Response `201 Created`:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": null,
    "created_at": "2026-09-30T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBh...",
    "expires_in": 900
  }
}
```

---

#### `POST /auth/login`

Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response `200 OK`:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": null,
    "created_at": "2026-09-30T10:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBh...",
    "expires_in": 900
  }
}
```

---

#### `POST /auth/oauth/:provider`

Authenticate via Google or Apple OAuth.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `provider` | `google` or `apple` |

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "access_token": "ya29.a0AfH6SMB..."
}
```

**Response `200 OK`:** Same as login response.

---

#### `POST /auth/refresh`

Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBh..."
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIG5ldy...",
  "expires_in": 900
}
```

---

#### `POST /auth/logout`

Invalidate the current refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Response `204 No Content`**

---

### 5.3 User Endpoints

#### `GET /users/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar_url": null,
  "created_at": "2026-09-30T10:00:00Z"
}
```

---

#### `PUT /users/me`

Update the authenticated user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "Jane Doe",
  "avatar_url": "https://cdn.example.com/avatars/jane.jpg"
}
```

**Response `200 OK`:** Updated user object.

---

### 5.4 Study Session Endpoints

#### `POST /sessions`

Save a completed or given-up study session.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "goal_text": "Study Chapter 5 - Data Structures",
  "topic_id": "computer-science",
  "target_duration_seconds": 1500,
  "actual_duration_seconds": 1500,
  "distraction_attempts": 2,
  "quiz_score": 3,
  "total_quiz_questions": 3,
  "is_completed": true,
  "apps_blocked": ["com.facebook.katana", "com.instagram.android", "com.zhiliaoapp.musically"],
  "documents": [
    {
      "id": "doc-001",
      "name": "Chapter5.pdf",
      "url": "https://cdn.example.com/docs/chapter5.pdf",
      "thumbnail_url": "https://cdn.example.com/thumbs/chapter5.jpg"
    }
  ]
}
```

**Response `201 Created`:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "goal_text": "Study Chapter 5 - Data Structures",
  "topic_id": "computer-science",
  "target_duration_seconds": 1500,
  "actual_duration_seconds": 1500,
  "distraction_attempts": 2,
  "quiz_score": 3,
  "total_quiz_questions": 3,
  "is_completed": true,
  "apps_blocked": ["com.facebook.katana", "com.instagram.android", "com.zhiliaoapp.musically"],
  "documents": [
    {
      "id": "doc-001",
      "name": "Chapter5.pdf",
      "url": "https://cdn.example.com/docs/chapter5.pdf",
      "thumbnail_url": "https://cdn.example.com/thumbs/chapter5.jpg"
    }
  ],
  "created_at": "2026-09-30T10:25:00Z"
}
```

---

#### `GET /sessions`

List the authenticated user's study sessions (paginated).

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `topic_id` | string | — | Filter by topic |
| `is_completed` | boolean | — | Filter by completion status |
| `sort` | string | `created_at:desc` | Sort field and direction |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "goal_text": "Study Chapter 5 - Data Structures",
      "topic_id": "computer-science",
      "target_duration_seconds": 1500,
      "actual_duration_seconds": 1500,
      "distraction_attempts": 2,
      "quiz_score": 3,
      "total_quiz_questions": 3,
      "is_completed": true,
      "created_at": "2026-09-30T10:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

---

#### `GET /sessions/:id`

Get a single study session by ID.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200 OK`:** Full session object including `apps_blocked` and `documents`.

---

#### `GET /sessions/stats`

Get aggregated statistics for the authenticated user.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `all` | `7d`, `30d`, `90d`, `all` |

**Response `200 OK`:**
```json
{
  "period": "30d",
  "total_sessions": 15,
  "completed_sessions": 12,
  "total_focus_time_seconds": 54000,
  "total_focus_time_formatted": "15h 0m",
  "average_focus_time_seconds": 3600,
  "average_focus_time_formatted": "1h 0m",
  "total_distraction_attempts": 8,
  "average_distraction_attempts": 0.53,
  "average_quiz_score": 0.85,
  "total_quiz_questions": 45,
  "total_quiz_correct": 38,
  "completion_rate": 0.80,
  "streak_days": 5,
  "most_blocked_apps": [
    { "app": "com.instagram.android", "count": 12 },
    { "app": "com.facebook.katana", "count": 8 },
    { "app": "com.zhiliaoapp.musically", "count": 5 }
  ],
  "daily_breakdown": [
    { "date": "2026-09-01", "focus_time_seconds": 3600, "sessions": 2 },
    { "date": "2026-09-02", "focus_time_seconds": 1800, "sessions": 1 }
  ]
}
```

---

### 5.5 Quiz Endpoints

#### `GET /quizzes`

Retrieve quiz questions for a specific topic.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic_id` | string | Yes | — | Topic identifier |
| `limit` | integer | No | 10 | Number of questions (max 50) |
| `difficulty` | string | No | — | `easy`, `medium`, `hard` |

**Response `200 OK`:**
```json
{
  "topic_id": "computer-science",
  "questions": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "question": "What is the time complexity of binary search?",
      "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      "correct_index": 1,
      "explanation": "Binary search halves the search space each iteration, resulting in O(log n) time complexity.",
      "difficulty": "medium"
    }
  ]
}
```

---

#### `POST /quizzes/answer`

Submit a quiz answer for a session.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "session_id": "660e8400-e29b-41d4-a716-446655440001",
  "question_id": "770e8400-e29b-41d4-a716-446655440002",
  "selected_index": 1
}
```

**Response `201 Created`:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "session_id": "660e8400-e29b-41d4-a716-446655440001",
  "question_id": "770e8400-e29b-41d4-a716-446655440002",
  "selected_index": 1,
  "is_correct": true,
  "answered_at": "2026-09-30T10:30:00Z"
}
```

---

#### `POST /quizzes/generate`

Generate dynamic quiz questions from uploaded documents using AI.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "topic_id": "biology",
  "document_ids": ["doc-001", "doc-002"],
  "question_count": 5,
  "difficulty": "medium"
}
```

**Response `200 OK`:**
```json
{
  "generated_questions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "topic_id": "biology",
      "question": "What is the primary function of mitochondria?",
      "options": [
        "Protein synthesis",
        "Energy production (ATP)",
        "Cell division",
        "Waste removal"
      ],
      "correct_index": 1,
      "explanation": "Mitochondria are known as the powerhouse of the cell, producing ATP through cellular respiration.",
      "difficulty": "medium",
      "source": "ai_generated"
    }
  ]
}
```

---

### 5.6 Document Endpoints

#### `POST /documents/upload`

Upload a study document (PDF, image, text).

**Headers:** `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`

**Request:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The document file |
| `name` | string | Display name |

**Response `201 Created`:**
```json
{
  "id": "doc-001",
  "name": "Chapter5.pdf",
  "url": "https://cdn.example.com/docs/chapter5.pdf",
  "thumbnail_url": "https://cdn.example.com/thumbs/chapter5.jpg",
  "size_bytes": 2048576,
  "mime_type": "application/pdf",
  "created_at": "2026-09-30T10:00:00Z"
}
```

---

#### `DELETE /documents/:id`

Delete an uploaded document.

**Headers:** `Authorization: Bearer <access_token>`

**Response `204 No Content`**

---

### 5.7 Topic Endpoints

#### `GET /topics`

List all available study topics.

**Headers:** `Authorization: Bearer <access_token>`

**Response `200 OK`:**
```json
{
  "topics": [
    {
      "id": "computer-science",
      "name": "Computer Science",
      "icon": "💻",
      "question_count": 150
    },
    {
      "id": "biology",
      "name": "Biology",
      "icon": "🧬",
      "question_count": 120
    },
    {
      "id": "mathematics",
      "name": "Mathematics",
      "icon": "📐",
      "question_count": 200
    }
  ]
}
```

---

## 6. Error Handling

### 6.1 Error Response Format

All errors follow RFC 7807 (Problem Details):

```json
{
  "type": "https://api.pomodoro-focus.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more fields failed validation.",
  "instance": "/api/v1/sessions",
  "errors": [
    {
      "field": "goal_text",
      "message": "must be at least 3 characters"
    },
    {
      "field": "target_duration_seconds",
      "message": "must be a positive integer"
    }
  ]
}
```

### 6.2 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Bad request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 422 | Unprocessable entity — semantic error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable |

### 6.3 Error Type URIs

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `validation-error` | 400 | Request body validation failed |
| `authentication-error` | 401 | Missing or invalid credentials |
| `authorization-error` | 403 | Insufficient permissions |
| `not-found` | 404 | Resource does not exist |
| `conflict` | 409 | Resource already exists |
| `rate-limit-exceeded` | 429 | Too many requests |
| `internal-error` | 500 | Unexpected server error |

---

## 7. Rate Limiting & Throttling

### 7.1 Limits

| Endpoint Category | Rate Limit | Window |
|-------------------|-----------|--------|
| Authentication | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Quiz Generation | 5 requests | 1 minute |
| Document Upload | 20 requests | 1 minute |

### 7.2 Rate Limit Headers

All responses include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1727654460
```

### 7.3 Rate Limit Exceeded Response

```json
{
  "type": "https://api.pomodoro-focus.com/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit. Please try again later.",
  "retry_after": 45
}
```

---

## 8. Data Validation

### 8.1 Validation Rules

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Valid email format, max 255 chars |
| `password` | string | Min 8 chars, 1 uppercase, 1 number, 1 special |
| `name` | string | 1–100 chars, no special characters |
| `goal_text` | string | 3–500 chars |
| `topic_id` | string | 1–50 chars, alphanumeric + hyphens |
| `target_duration_seconds` | integer | 60–72000 (1 min – 20 hours) |
| `actual_duration_seconds` | integer | 0–72000 |
| `distraction_attempts` | integer | 0–10000 |
| `quiz_score` | integer | 0–100 |
| `total_quiz_questions` | integer | 1–50 |
| `selected_index` | integer | 0–3 |
| `apps_blocked` | array | Max 50 items, each max 100 chars |
| `options` | array | Exactly 4 items, each max 500 chars |

### 8.2 Validation Library

All inputs validated using **Zod** schemas:

```typescript
const StudySessionSchema = z.object({
  goal_text: z.string().min(3).max(500),
  topic_id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  target_duration_seconds: z.number().int().min(60).max(72000),
  actual_duration_seconds: z.number().int().min(0).max(72000),
  distraction_attempts: z.number().int().min(0).max(10000),
  quiz_score: z.number().int().min(0).max(100),
  total_quiz_questions: z.number().int().min(1).max(50),
  is_completed: z.boolean(),
  apps_blocked: z.array(z.string().max(100)).max(50),
  documents: z.array(DocumentSchema).max(10)
});
```

---

## 9. WebSocket / Real-time Communication

### 9.1 Connection

```
wss://api.pomodoro-focus.com/ws/v1?token=<access_token>
```

### 9.2 Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `session:start` | `{ session_id, topic_id, target_duration }` | Notify server that focus session started |
| `distraction:attempt` | `{ session_id, app_id, timestamp }` | Log a distraction attempt |
| `session:end` | `{ session_id, actual_duration, is_completed }` | Notify server that session ended |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `session:tick` | `{ session_id, remaining_seconds }` | Timer sync (every 30s) |
| `distraction:warning` | `{ session_id, message }` | Warning when blocked app opened |
| `session:complete` | `{ session_id }` | Timer reached zero |

### 9.3 Distraction Tracking Flow

```
Client                          Server
  │                               │
  │── session:start ─────────────►│
  │                               │
  │                               │ (user opens blocked app)
  │                               │
  │◄─ distraction:warning ────────│
  │                               │
  │── distraction:attempt ───────►│
  │                               │
  │                               │ (timer reaches 0)
  │                               │
  │◄─ session:complete ───────────│
  │                               │
  │── session:end ───────────────►│
  │                               │
```

---

## 10. File Storage

### 10.1 Document Upload Flow

```
Client                          Server                    S3
  │                               │                         │
  │── POST /documents/upload ────►│                         │
  │   (multipart/form-data)       │                         │
  │                               │── Generate presigned ──►│
  │                               │   URL                  │
  │                               │◄─ presigned URL ────────│
  │◄─ document metadata + ───────│                         │
  │   upload_url                  │                         │
  │                               │                         │
  │── PUT file to S3 ────────────────────────────────────►│
  │   (presigned URL)             │                         │
  │                               │                         │
  │── POST /documents/confirm ───►│                         │
  │   { document_id }             │                         │
  │                               │── Process thumbnail ───►│
  │                               │   (Lambda/Worker)       │
  │◄─ 200 OK ────────────────────│                         │
```

### 10.2 Supported File Types

| Type | Max Size | MIME Types |
|------|----------|------------|
| PDF | 20 MB | `application/pdf` |
| Image | 10 MB | `image/jpeg`, `image/png`, `image/webp` |
| Text | 5 MB | `text/plain`, `text/markdown` |

---

## 11. Deployment & Infrastructure

### 11.1 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `http://localhost:3000` | Local development |
| Staging | `https://staging-api.pomodoro-focus.com` | Pre-production testing |
| Production | `https://api.pomodoro-focus.com` | Live production |

### 11.2 Docker Compose (Development)

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/pomodoro
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pomodoro
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  pgdata:
```

### 11.3 Production Architecture

```
                    ┌─────────────┐
                    │  CloudFlare │
                    │    (CDN)    │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  AWS ALB    │
                    │  (HTTPS)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  ECS     │ │  ECS     │ │  ECS     │
        │ Task 1   │ │ Task 2   │ │ Task 3   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌────────┐
        │  RDS     │ │ElastiCache│ │  S3   │
        │PostgreSQL│ │  Redis   │ │       │
        └──────────┘ └────────┘ └────────┘
```

---

## 12. API Versioning Strategy

### 12.1 URL Path Versioning

```
/api/v1/sessions
/api/v2/sessions  (future)
```

### 12.2 Version Lifecycle

| Version | Status | Sunset Date |
|---------|--------|-------------|
| v1 | Current | — |
| v2 | Planned | TBD |

### 12.3 Deprecation Policy

- Deprecation announced 6 months in advance
- `Deprecation` and `Sunset` headers added to responses
- Migration guide provided for each new version

---

## 13. Monitoring & Logging

### 13.1 Structured Logging

```json
{
  "timestamp": "2026-09-30T10:00:00.000Z",
  "level": "info",
  "request_id": "req-abc123",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/sessions",
  "status": 201,
  "duration_ms": 145,
  "user_agent": "PomodoroApp/1.0.0"
}
```

### 13.2 Key Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `active_sessions` | Gauge | Currently active focus sessions |
| `quiz_generation_duration` | Histogram | AI quiz generation time |
| `error_rate` | Gauge | Percentage of 5xx errors |

### 13.3 Health Check

#### `GET /health`

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": "up",
    "redis": "up",
    "s3": "up"
  }
}
```

---

## 14. Testing Strategy

### 14.1 Test Types

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | Vitest | 80%+ |
| Integration Tests | Supertest | All endpoints |
| E2E Tests | Detox | Critical user flows |
| Load Tests | k6 | 1000 RPS sustained |

### 14.2 Test Environments

- **Unit/Integration:** Run in CI on every PR
- **E2E:** Run on staging before production deploy
- **Load:** Run weekly against staging

### 14.3 CI/CD Pipeline

```
PR Opened
  │
  ▼
┌─────────────┐
│  Lint &     │
│  Type Check │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Unit Tests │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Build      │
│  Docker     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Deploy to  │
│  Staging    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  E2E Tests  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Deploy to  │
│  Production │
└─────────────┘
```

---

## Appendix A: Complete Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Email/password login |
| POST | `/auth/oauth/:provider` | No | OAuth login |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `//auth/logout` | Yes | Invalidate session |
| GET | `/users/me` | Yes | Get profile |
| PUT | `/users/me` | Yes | Update profile |
| POST | `/sessions` | Yes | Save study session |
| GET | `/sessions` | Yes | List sessions |
| GET | `/sessions/:id` | Yes | Get session detail |
| GET | `/sessions/stats` | Yes | Get aggregated stats |
| GET | `/quizzes` | Yes | Get quiz questions |
| POST | `/quizzes/answer` | Yes | Submit quiz answer |
| POST | `/quizzes/generate` | Yes | AI-generate questions |
| POST | `/documents/upload` | Yes | Upload document |
| DELETE | `/documents/:id` | Yes | Delete document |
| GET | `/topics` | Yes | List topics |
| GET | `/health` | No | Health check |

---

## Appendix B: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | Yes | `development`, `staging`, `production` |
| `S3_BUCKET` | Yes | S3 bucket name |
| `S3_REGION` | Yes | AWS region |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `APPLE_CLIENT_ID` | Yes | Apple OAuth client ID |
| `APPLE_CLIENT_SECRET` | Yes | Apple OAuth client secret |
| `CORS_ORIGIN` | Yes | Allowed CORS origin |

---

*End of Backend & API Specifications*
