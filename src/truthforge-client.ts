/**
 * TruthForge API Client
 * Frontend client for communicating with the TruthForge backend API
 */

export interface DebateRequest {
  question: string;
  session_id?: string;
  domain?: string;
  depth?: number;
}

export interface DebateResponse {
  success: boolean;
  session_id: string;
  debate_id?: string;
  question: string;
  complexity: string;
  analysis: string;
  supporting_signals: string[];
  counterarguments: string[];
  confidence: string;
  final_answer: string;
  reasoning_chain: string[];
  verdict: {
    evaluation: string;
    logic_quality_score: number;
    evidence_strength_score: number;
    assumption_validity: number;
    overall_confidence: number;
  };
  agents_used?: string[];
  execution_time_ms?: number;
  timestamp: string;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  debate_id?: string;
  timestamp: string;
  request_id?: string;
  details?: string;
}

const API_BASE_URL = 'http://localhost:3000/api/truthforge';
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Health check for API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Submit a debate question to the API
 */
export async function submitDebateQuestion(request: DebateRequest): Promise<DebateResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/debate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to process question');
    }

    return data as DebateResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`API request failed: ${errorMessage}`);
  }
}

/**
 * Retrieve a specific debate by ID
 */
export async function getDebate(debateId: string): Promise<DebateResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/debate/${debateId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to retrieve debate');
    }

    return data as DebateResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve debate: ${errorMessage}`);
  }
}

/**
 * Get list of recent debates
 */
export async function listDebates(limit: number = 10, offset: number = 0): Promise<{ debates: DebateResponse[]; total: number }> {
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await fetchWithTimeout(`${API_BASE_URL}/debates?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to list debates');
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to list debates: ${errorMessage}`);
  }
}

/**
 * Get memory entry by ID
 */
export async function getMemory(memoryId: string): Promise<unknown> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/memory/${memoryId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to retrieve memory');
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve memory: ${errorMessage}`);
  }
}

/**
 * Submit feedback for a debate
 */
export async function submitFeedback(
  debateId: string,
  rating?: number,
  comment?: string,
  helpful?: boolean
): Promise<{ success: boolean; feedback_id: string; timestamp: string }> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debate_id: debateId,
        rating,
        comment,
        helpful,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Failed to submit feedback');
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to submit feedback: ${errorMessage}`);
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function submitDebateQuestionWithRetry(
  request: DebateRequest,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<DebateResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await submitDebateQuestion(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export default {
  checkApiHealth,
  submitDebateQuestion,
  submitDebateQuestionWithRetry,
  getDebate,
  listDebates,
  getMemory,
  submitFeedback,
};
