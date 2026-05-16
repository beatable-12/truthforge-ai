# Gemini API Integration - TruthForge AI

## Overview

TruthForge AI now integrates Google's Gemini 2.0 Flash API for real-time reasoning and debate generation. This document describes the integration architecture and how the system uses Gemini for various reasoning tasks.

## Architecture

### Core Components

1. **GeminiClient** (`src/gemini-client.ts`)
   - Wrapper around Google Generative AI SDK
   - Handles API initialization, error handling, and retry logic
   - Implements 5 key reasoning functions:
     - `generateThesis()` - Generate supporting position
     - `generateAntithesis()` - Generate counter-position  
     - `analyzeEvidence()` - Evaluate evidence quality
     - `generateSynthesis()` - Create final analysis
     - `generateVerdict()` - Judge reasoning quality

2. **Prompt Templates** (`src/prompts.ts`)
   - Carefully crafted prompts for each reasoning task
   - Prompts designed to elicit structured JSON responses
   - Ensures consistency across API calls
   - Includes scoring guidelines and output format specifications

3. **Response Parser** (`src/response-parser.ts`)
   - Parses Gemini's text responses into structured formats
   - Extracts JSON objects from responses
   - Fallback handling for malformed responses
   - Validation of parsed data

4. **API Integration** (`src/truthforge_api.ts`)
   - Updated `processQuestion()` method uses Gemini
   - Implements reasoning chain: Thesis → Antithesis → Evidence Analysis → Synthesis → Verdict
   - Fallback to mock results if Gemini fails
   - Stores all results in SQLite database

## Reasoning Flow

When a question is processed:

1. **Question Storage**: Question stored in database
2. **Thesis Generation**: Gemini generates strongest supporting position
3. **Antithesis Generation**: Gemini generates counter-arguments
4. **Evidence Analysis**: Gemini analyzes mock evidence for credibility/relevance
5. **Synthesis**: Gemini creates comprehensive analysis integrating all data
6. **Verdict**: Gemini evaluates quality of reasoning and evidence
7. **Result Storage**: All artifacts stored in database with timestamps

## API Calls and Prompting

### Thesis Generation
- Input: Question, Topic domain
- Prompt: Requests strongest supporting position with 5 key points
- Output: JSON with thesis statement, key points, reasoning, strength score (0-1)

### Antithesis Generation
- Input: Array of thesis key points
- Prompt: Requests compelling counter-arguments to each point
- Output: JSON with antithesis statement, counter-points, strength score (0-1)

### Evidence Analysis
- Input: Evidence text, Related claim
- Prompt: Requests evaluation of credibility and relevance
- Output: JSON with credibility score (0-1), relevance score (0-1), key findings, quality assessment

### Synthesis
- Input: Question, thesis, antithesis, evidence analyses
- Prompt: Requests comprehensive integration of all information
- Output: JSON with analysis, supporting signals, counterarguments, confidence level, final answer

### Verdict
- Input: Thesis, antithesis, evidence scores
- Prompt: Requests evaluation of reasoning quality
- Output: JSON with evaluation, logic quality (0-1), evidence strength (0-1), assumption validity (0-1), overall confidence (0-1)

## Environment Configuration

Required environment variables:

```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
LOG_LEVEL=info
```

Set `GEMINI_API_KEY` in your `.env` file. Get an API key from [Google AI Studio](https://aistudio.google.com).

## Error Handling

### Retry Logic
- Automatically retries failed API calls up to 3 times
- Exponential backoff: 1s, 2s, 4s between retries
- Logs all retry attempts

### Fallback Mechanisms
1. If Gemini fails during debate generation, falls back to mock results
2. If response parsing fails, returns fallback values
3. All errors logged with context for debugging

### Rate Limiting
- Respects Gemini API rate limits
- Implements backoff strategy for rate limit errors
- Can process multiple questions sequentially

## Performance Characteristics

- **Thesis Generation**: ~2-3 seconds
- **Antithesis Generation**: ~2-3 seconds
- **Evidence Analysis** (per piece): ~1-2 seconds
- **Synthesis**: ~2-3 seconds
- **Verdict**: ~1-2 seconds
- **Total per question**: ~10-15 seconds

## Type Safety

All components are fully typed with TypeScript:

```typescript
interface ParsedThesis {
  thesis: string;
  key_points: string[];
  reasoning?: string;
  strength: number;
  assumptions?: string[];
}

interface AnalysisResult {
  credibility_score: number;
  relevance_score: number;
  key_findings: string[];
  quality_assessment: string;
}
```

## Logging

All Gemini operations are logged at various levels:

- `debug`: Detailed API call information
- `info`: Major operation starts/completions
- `warn`: Retries and fallback activations
- `error`: Critical failures

Set `LOG_LEVEL=debug` for detailed Gemini debugging.

## Usage Example

```typescript
import { TruthForgeAPI } from './src/truthforge_api';

const api = new TruthForgeAPI();
const response = await api.processQuestion(req, res);
// Response includes:
// - Thesis with supporting claims
// - Antithesis with counter-arguments
// - Evidence analysis with scores
// - Synthesis with final analysis
// - Verdict with quality scores
```

## Testing

To test Gemini integration:

```bash
# Set environment variables
export GEMINI_API_KEY=your_key_here

# Run the application
npm run dev

# Make a test request
curl -X POST http://localhost:3000/api/truthforge/process \
  -H "Content-Type: application/json" \
  -d '{"question": "Is artificial intelligence beneficial to society?"}'
```

## Production Considerations

1. **API Cost**: Gemini API usage is billed. Monitor costs in Google Cloud Console.
2. **Rate Limits**: Default limit is requests per minute. Consider caching similar questions.
3. **Latency**: API calls add 10-15 seconds per question. Consider async processing for many questions.
4. **Reliability**: Always have fallback mock results configured.
5. **Caching**: Consider implementing a cache layer for frequently asked questions.

## Future Enhancements

1. **Response Caching**: Cache similar questions to reduce API calls
2. **Streaming**: Stream responses for real-time updates
3. **Custom Models**: Fine-tune Gemini on specific domains
4. **Batch Processing**: Process multiple questions in parallel
5. **Citation Tracking**: Track which evidence sources contribute to conclusions

## Troubleshooting

### API Key Not Found
- Ensure `GEMINI_API_KEY` is set in `.env`
- Verify key is valid and not expired
- Check API quota in Google Cloud Console

### Rate Limit Errors
- Application automatically retries with backoff
- Check API usage in Google Cloud Console
- Consider caching for duplicate questions

### Parsing Errors
- Check Gemini response format in logs
- Increase `LOG_LEVEL` to `debug` for detailed output
- Verify prompts are generating valid JSON

### Timeout Errors
- Increase request timeout if needed
- Reduce complexity of questions
- Check network connectivity

## Files Modified/Created

- ✅ `src/gemini-client.ts` - New Gemini API wrapper
- ✅ `src/prompts.ts` - New prompt templates
- ✅ `src/response-parser.ts` - New response parsing
- ✅ `src/truthforge_evidence.jac` - Updated with Gemini integration note
- ✅ `src/truthforge_api.ts` - Updated to call Gemini
- ✅ `package.json` - Added @google/generative-ai dependency
