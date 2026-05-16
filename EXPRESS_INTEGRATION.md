# TruthForge Express.js Integration Guide

Complete integration documentation for the TruthForge backend with Express.js server.

## Overview

The TruthForge backend is now fully integrated with Express.js, providing RESTful API endpoints for the frontend to submit questions and retrieve reasoning results.

### Architecture

```
Frontend (React + Vite)
        ↓ (POST /api/truthforge/debate)
Express.js Server (Port 3000)
        ↓
Middleware:
  - CORS Handler
  - Logger
  - Rate Limiter
  - Error Handler
        ↓
TruthForge Router
        ↓
TruthForgeAPI
  - GeminiClient
  - EvidenceOrchestrator
  - ResponseParser
        ↓
SQLite Database
        ↓
Jac Walker Agents (8 agents)
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `@types/express` - TypeScript types

### 2. Environment Variables

Create or update `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
TRUTHFORGE_DB_PATH=./truthforge.db

# Gemini API
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Logging
LOG_LEVEL=info
```

### 3. Start the API Server

```bash
# Development mode with auto-reload
npm run api:dev

# Production mode
npm run api
```

Output:
```
[Server] ✓ TruthForge API server running on http://localhost:3000
[Server] CORS enabled for: http://localhost:5173, http://localhost:3000
```

### 4. Verify Server is Running

```bash
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "service": "truthforge-api",
  "database": {
    "healthy": true,
    "message": "Database is healthy with 8 tables"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 45.123
}
```

## API Endpoints

### Health Check

```
GET /api/truthforge/health
```

**Response:**
```json
{
  "success": true,
  "service": "truthforge-api",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 45.123
}
```

---

### Submit Debate Question

```
POST /api/truthforge/debate
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "Is artificial intelligence a threat to humanity?",
  "session_id": "session_abc123", // Optional
  "domain": "technology",           // Optional
  "depth": 3                        // Optional
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "session_id": "session_abc123",
  "debate_id": "debate_xyz789",
  "question": "Is artificial intelligence a threat to humanity?",
  "complexity": "high",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "execution_time_ms": 4523,
  "agents_used": [
    "planner",
    "memory",
    "thesis",
    "antithesis",
    "evidence",
    "referee",
    "synthesis",
    "memory_update"
  ],
  "thesis": {
    "claim": "AI poses significant risks...",
    "confidence": 0.82
  },
  "antithesis": {
    "claim": "AI benefits outweigh risks...",
    "confidence": 0.75
  },
  "evidence": [
    {
      "source": "research.org/study-2024",
      "credibility": 0.92,
      "summary": "Recent study shows..."
    }
  ],
  "verdict": {
    "assessment": "Both positions have merit...",
    "confidence": 0.78,
    "logic_quality_score": 0.82,
    "evidence_strength_score": 0.85,
    "assumption_validity": 0.78,
    "overall_confidence": 0.81
  },
  "synthesis": {
    "analysis": "Comprehensive analysis showing...",
    "supporting_signals": [
      "Signal 1: Strong logical foundation",
      "Signal 2: Empirical support",
      "Signal 3: Established principles"
    ],
    "counterarguments": [
      "Counter 1: Alternative view",
      "Counter 2: Different context"
    ],
    "confidence": "High",
    "final_answer": "Based on comprehensive analysis..."
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Question is required and must be a non-empty string",
  "debate_id": null,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req_1705316400000_abc123def"
}
```

**Response (Rate Limited - 429):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retry_after_seconds": 45,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705316460000
Retry-After: 45
```

---

### Get Debate Details

```
GET /api/truthforge/debate/:debateId
```

**Response:**
```json
{
  "success": true,
  "debate": { /* debate object */ },
  "verdict": { /* verdict object */ },
  "reasoning": { /* reasoning object */ },
  "claims": [ /* array of claims */ ],
  "evidence": [ /* array of evidence */ ]
}
```

---

### List Recent Debates

```
GET /api/truthforge/debates?limit=10&offset=0
```

**Query Parameters:**
- `limit` - Number of debates to return (default: 10, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "debates": [ /* array of debate objects */ ],
  "count": 5,
  "limit": 10,
  "offset": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Memory Entry

```
GET /api/truthforge/memory/:id
```

**Response:**
```json
{
  "success": true,
  "memory": { /* memory object */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Submit Feedback

```
POST /api/truthforge/feedback
Content-Type: application/json
```

**Request Body:**
```json
{
  "debate_id": "debate_xyz789",
  "rating": 4,                    // 1-5
  "comment": "Very helpful!",     // Optional
  "helpful": true                 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "feedback_id": "feedback_abc123",
  "message": "Feedback received",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Frontend Integration

### 1. Install Client Library

Use the provided `truthforge-client.ts`:

```typescript
import {
  submitDebateQuestion,
  checkApiHealth,
  submitFeedback,
} from './truthforge-client';
```

### 2. Check API Availability

```typescript
const isHealthy = await checkApiHealth();
if (!isHealthy) {
  console.error('API server is not available');
}
```

### 3. Submit Question

```typescript
try {
  const response = await submitDebateQuestion({
    question: 'Your question here',
  });

  console.log('Debate ID:', response.debate_id);
  console.log('Final Answer:', response.synthesis.final_answer);
} catch (error) {
  console.error('Failed to submit question:', error);
}
```

### 4. Handle Loading State

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [result, setResult] = useState<DebateResponse | null>(null);

const handleSubmit = async (question: string) => {
  setLoading(true);
  setError(null);

  try {
    const response = await submitDebateQuestion({ question });
    setResult(response);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

### 5. Display Results

```typescript
{result && (
  <div>
    <h2>Debate Results</h2>
    <p>Complexity: {result.complexity}</p>
    <p>Final Answer: {result.synthesis.final_answer}</p>
    <p>Confidence: {result.synthesis.confidence}</p>

    <h3>Thesis</h3>
    <p>{result.thesis.claim}</p>

    <h3>Antithesis</h3>
    <p>{result.antithesis.claim}</p>

    <h3>Evidence</h3>
    {result.evidence.map((ev, i) => (
      <div key={i}>
        <p>Source: {ev.source}</p>
        <p>Credibility: {ev.credibility}</p>
      </div>
    ))}
  </div>
)}
```

## Error Handling

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Debate processed |
| 400 | Bad Request | Missing question |
| 404 | Not Found | Debate ID not found |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Gemini API failure |
| 503 | Service Unavailable | Database error |

### Error Response Format

```json
{
  "success": false,
  "error": "Description of what went wrong",
  "debate_id": "debate_xyz" // If applicable
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req_1705316400000_abc123def",
  "details": "Stack trace (development only)"
}
```

## Rate Limiting

- **Limit:** 10 requests per minute per IP/session
- **Window:** 60 seconds
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
  - `Retry-After`: Seconds to wait before retrying

## Logging

### Request Logging

All API requests are logged with:
- Request ID
- Method and path
- Request body (sanitized)
- Response status
- Execution time

Example:
```
[API] [req_1705316400000_abc123def] POST /api/truthforge/debate - Request received at 2024-01-15T10:30:00.000Z
[API] [req_1705316400000_abc123def] ✓ 200 - POST /api/truthforge/debate completed in 4523ms
```

### Debug Logging

Set `LOG_LEVEL=debug` to see detailed logs:
```
[TRUTHFORGE] Starting debate debate_xyz789 for question: "Is AI a threat?"
[TRUTHFORGE] Generating thesis...
[TRUTHFORGE] Generating antithesis...
[TRUTHFORGE] Generating synthesis...
[TRUTHFORGE] Debate debate_xyz789 completed in 4523ms
```

## CORS Configuration

Allowed origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (API server)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

**Note:** Update `src/express-server.ts` to add production domains.

## Database Integration

### Tables Created on Startup

1. **debates** - Debate sessions
2. **questions** - Questions submitted
3. **claims** - Thesis and antithesis claims
4. **evidence** - Supporting evidence
5. **verdicts** - Debate verdicts
6. **reasoning** - Synthesis results
7. **memory** - Historical reasoning

### Query Example

```typescript
import Database from 'better-sqlite3';

const db = new Database('./truthforge.db');
const debates = db.prepare('SELECT * FROM debates ORDER BY created_at DESC LIMIT 10').all();
db.close();
```

## Performance Optimization

### Caching

Implement caching for repeated questions:
```typescript
const cache = new Map<string, DebateResponse>();

export async function submitDebateQuestionCached(
  question: string
): Promise<DebateResponse> {
  if (cache.has(question)) {
    return cache.get(question)!;
  }

  const response = await submitDebateQuestion({ question });
  cache.set(question, response);
  return response;
}
```

### Batching

Batch multiple questions efficiently:
```typescript
const questions = ['Question 1', 'Question 2', 'Question 3'];
const results = await Promise.all(
  questions.map(q => submitDebateQuestion({ question: q }))
);
```

## Troubleshooting

### API Server Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=3001 npm run api:dev
```

### Database Errors

```bash
# Check database file
ls -lah ./truthforge.db

# Reset database (development only)
rm ./truthforge.db
npm run api:dev  # Will recreate on startup
```

### CORS Errors

Check that:
1. Frontend is on `http://localhost:5173`
2. API is on `http://localhost:3000`
3. Headers include `Content-Type: application/json`

### Rate Limit Exceeded

Wait for the `Retry-After` duration before retrying, or use retry logic:

```typescript
import { submitDebateQuestionWithRetry } from './truthforge-client';

const result = await submitDebateQuestionWithRetry(
  { question: 'Your question' },
  3,  // max retries
  1000 // base delay in ms
);
```

## Production Deployment

### 1. Set Environment Variables

```bash
export NODE_ENV=production
export GEMINI_API_KEY=prod_key
export TRUTHFORGE_DB_PATH=/var/data/truthforge.db
```

### 2. Update CORS Origins

In `src/express-server.ts`:
```typescript
cors({
  origin: [
    'https://yourfrontend.com',
    'https://api.yourbackend.com',
  ],
})
```

### 3. Run Server

```bash
npm run api
```

### 4. Monitor Logs

```bash
npm run api 2>&1 | tee api.log
```

### 5. Use Process Manager

```bash
npm install -g pm2
pm2 start --name "truthforge-api" npm -- run api
pm2 logs truthforge-api
```

## API Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Submit debate
curl -X POST http://localhost:3000/api/truthforge/debate \
  -H "Content-Type: application/json" \
  -d '{"question": "Is climate change human-caused?"}'
```

### Using Postman

1. Set request to `POST`
2. URL: `http://localhost:3000/api/truthforge/debate`
3. Headers: `Content-Type: application/json`
4. Body:
```json
{
  "question": "Your question here"
}
```

### Using JavaScript

See `truthforge-client.ts` for ready-to-use functions.

## Support

For issues or questions:
1. Check logs with `LOG_LEVEL=debug`
2. Review this documentation
3. Check `./truthforge_schema.sql` for database schema
4. Review `src/api-routes.ts` for endpoint implementations
