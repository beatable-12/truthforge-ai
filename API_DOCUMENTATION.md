# TruthForge AI - API Documentation

Complete API reference for TruthForge reasoning engine.

## Base URL

```
http://localhost:3000          # Development
https://truthforge.example.com # Production
```

## Authentication

Currently, no authentication is required. In production:
- Consider adding API key authentication
- Implement rate limiting (enabled by default: 10 req/min per session)
- Add request signing if needed

## Endpoints

### Health & Status

#### GET /health
Basic server health check.

**Response (200 OK)**
```json
{
  "status": "healthy",
  "service": "truthforge-api",
  "database": {
    "healthy": true,
    "message": "Database connection successful",
    "lastCheck": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

**Response (503 Service Unavailable)**
```json
{
  "status": "degraded",
  "service": "truthforge-api",
  "database": {
    "healthy": false,
    "message": "Database connection failed",
    "lastCheck": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 0,
  "environment": "production"
}
```

---

#### GET /api/truthforge/health
Full system health check including database status.

**Query Parameters**
- None

**Response (200 OK)**
```json
{
  "status": "healthy",
  "service": "truthforge-api",
  "database": {
    "healthy": true,
    "message": "Database connection successful",
    "tableCount": 5,
    "lastCheck": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

### Debate Operations

#### POST /api/truthforge/debate
Start a new reasoning debate on a question.

**Headers**
```
Content-Type: application/json
```

**Request Body**
```json
{
  "question": "Is artificial intelligence safe?",
  "context": "Recent developments in AI capabilities",
  "webSearchEnabled": true
}
```

**Request Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| question | string | Yes | The question to analyze |
| context | string | No | Additional context for reasoning |
| webSearchEnabled | boolean | No | Enable web search (default: true) |

**Response (200 OK)**
```json
{
  "success": true,
  "debateId": "debate_123456789",
  "question": "Is artificial intelligence safe?",
  "status": "completed",
  "thesis": {
    "claim": "AI safety is a complex but manageable challenge",
    "credibility": 0.82,
    "confidence": 0.85
  },
  "antithesis": {
    "claim": "Current AI systems pose existential risks",
    "credibility": 0.78,
    "confidence": 0.80
  },
  "synthesis": {
    "claim": "AI safety requires both technical safeguards and governance",
    "credibility": 0.85,
    "confidence": 0.88
  },
  "evidence": [
    {
      "source": "https://example.com",
      "claim": "Supporting evidence",
      "credibility": 0.90
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "processingTime": 2500
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "Question is required",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (429 Too Many Requests)**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 10 requests per minute",
  "retryAfter": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### GET /api/truthforge/debate/:debateId
Retrieve results of a completed debate.

**URL Parameters**
- `debateId` (string) - Debate identifier from POST response

**Response (200 OK)**
```json
{
  "success": true,
  "debateId": "debate_123456789",
  "question": "Is artificial intelligence safe?",
  "status": "completed",
  "thesis": {
    "claim": "AI safety is a complex but manageable challenge",
    "credibility": 0.82,
    "reasoning": "Multi-layer approach to safety..."
  },
  "antithesis": {
    "claim": "Current AI systems pose existential risks",
    "credibility": 0.78,
    "reasoning": "Rapid capability scaling creates challenges..."
  },
  "synthesis": {
    "claim": "AI safety requires both technical safeguards and governance",
    "credibility": 0.85,
    "reasoning": "Balanced approach considering both perspectives..."
  },
  "evidence": [
    {
      "source": "https://example.com",
      "claim": "Supporting evidence",
      "credibility": 0.90,
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "memory": {
    "learned": true,
    "insights": ["Key learning 1", "Key learning 2"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "processingTime": 2500
}
```

**Response (404 Not Found)**
```json
{
  "success": false,
  "error": "Debate not found",
  "debateId": "debate_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### GET /api/truthforge/debates
List recent debates.

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Number of results (max 100) |
| offset | number | 0 | Pagination offset |
| status | string | all | Filter by status: pending, completed, failed |

**Request**
```
GET /api/truthforge/debates?limit=20&offset=0&status=completed
```

**Response (200 OK)**
```json
{
  "success": true,
  "debates": [
    {
      "debateId": "debate_123456789",
      "question": "Is artificial intelligence safe?",
      "status": "completed",
      "credibility": 0.85,
      "timestamp": "2024-01-15T10:30:00Z",
      "processingTime": 2500
    },
    {
      "debateId": "debate_987654321",
      "question": "What is the future of AI?",
      "status": "completed",
      "credibility": 0.82,
      "timestamp": "2024-01-15T09:30:00Z",
      "processingTime": 2200
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 42
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Memory & Learning

#### GET /api/truthforge/memory/:id
Retrieve prior reasoning memory and learned insights.

**URL Parameters**
- `id` (string) - Memory identifier

**Response (200 OK)**
```json
{
  "success": true,
  "memoryId": "memory_123456789",
  "insights": [
    {
      "topic": "AI safety",
      "learning": "Safety is best achieved through multi-layered approach",
      "confidence": 0.85,
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "relatedDebates": ["debate_123456789", "debate_987654321"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (404 Not Found)**
```json
{
  "success": false,
  "error": "Memory not found",
  "memoryId": "memory_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### POST /api/truthforge/feedback
Submit feedback on debate results.

**Request Body**
```json
{
  "debateId": "debate_123456789",
  "feedback": "Very informative analysis",
  "rating": 5,
  "helpful": true,
  "notes": "Particularly appreciated the evidence synthesis"
}
```

**Request Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| debateId | string | Yes | Debate to provide feedback on |
| feedback | string | Yes | Feedback text |
| rating | number | No | Rating 1-5 |
| helpful | boolean | No | Was this helpful? |
| notes | string | No | Additional notes |

**Response (200 OK)**
```json
{
  "success": true,
  "feedbackId": "feedback_123456789",
  "debateId": "debate_123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Feedback recorded successfully"
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "Debate ID and feedback are required",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Database or service unavailable |

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_QUESTION | 400 | Question is required or invalid |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| NOT_FOUND | 404 | Resource not found |
| DATABASE_ERROR | 500 | Database operation failed |
| API_ERROR | 500 | Gemini API error |
| SEARCH_ERROR | 500 | Web search failed |

---

## Rate Limiting

The API enforces rate limiting to prevent abuse.

**Default Limits**
- 10 requests per minute per session
- Applies to `/api/truthforge/*` endpoints
- Header `X-RateLimit-Remaining` shows remaining requests

**Rate Limit Headers**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1705318200
```

**When Rate Limited (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 10 requests per minute",
  "retryAfter": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Examples

### JavaScript/Node.js

```javascript
// Debate request
const response = await fetch('http://localhost:3000/api/truthforge/debate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Is AI beneficial to society?',
    context: 'Considering recent developments',
    webSearchEnabled: true
  })
});

const result = await response.json();
console.log(result.debateId);
```

### cURL

```bash
# Start debate
curl -X POST http://localhost:3000/api/truthforge/debate \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Is AI beneficial to society?",
    "context": "Considering recent developments",
    "webSearchEnabled": true
  }'

# Get debate results
curl http://localhost:3000/api/truthforge/debate/debate_123456789

# List recent debates
curl 'http://localhost:3000/api/truthforge/debates?limit=10'

# Health check
curl http://localhost:3000/health
```

### Python

```python
import requests

# Start debate
response = requests.post('http://localhost:3000/api/truthforge/debate', json={
    'question': 'Is AI beneficial to society?',
    'context': 'Considering recent developments',
    'webSearchEnabled': True
})

result = response.json()
debate_id = result['debateId']

# Get results
results = requests.get(f'http://localhost:3000/api/truthforge/debate/{debate_id}').json()
print(results['synthesis'])
```

---

## Performance Metrics

### Response Times

| Endpoint | Typical | Max |
|----------|---------|-----|
| /health | <10ms | 50ms |
| /api/truthforge/health | <50ms | 200ms |
| POST /debate | 2-5s | 30s |
| GET /debate/:id | <100ms | 500ms |
| GET /debates | <200ms | 1s |

### Payload Sizes

| Operation | Request | Response |
|-----------|---------|----------|
| Debate | 500B-2KB | 5-20KB |
| Get debate | 0B | 5-20KB |
| List debates | 0B | 10-50KB |
| Feedback | 200-1KB | 200B |

---

## Webhooks (Future)

Planned for future versions:
- Debate completion webhooks
- Feedback event webhooks
- Error event webhooks

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Debate reasoning engine
- Memory system
- Web search integration
- Rate limiting

---

## Support

For API issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review error response details
3. Check server health with `/health` endpoint
4. Review logs in `/data/logs/`

For features or bugs:
- Document the issue with full error message
- Include request/response examples
- Provide reproduction steps
