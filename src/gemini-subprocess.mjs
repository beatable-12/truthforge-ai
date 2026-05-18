import { GoogleGenerativeAI } from '@google/generative-ai';

const readStdin = async () => {
  process.stdin.setEncoding('utf8');
  let buf = '';
  for await (const chunk of process.stdin) buf += chunk;
  return buf.trim();
};

const makeAbortSignal = (ms) => {
  if (typeof AbortSignal?.timeout === 'function') return AbortSignal.timeout(ms);
  return undefined;
};

(async () => {
  try {
    const raw = await readStdin();
    const req = raw ? JSON.parse(raw) : {};

    const apiKey = req.apiKey || process.env.GEMINI_API_KEY;
    const modelName = req.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const prompt = req.prompt;
    const timeoutMs = Number.isFinite(req.timeoutMs) ? req.timeoutMs : Number(process.env.GEMINI_CALL_TIMEOUT_MS || 8000);

    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    if (!prompt) throw new Error('Missing prompt');

    const client = new GoogleGenerativeAI(apiKey);
    const requestOptions = { timeout: timeoutMs, signal: makeAbortSignal(timeoutMs) };
    const model = client.getGenerativeModel({ model: modelName }, requestOptions);

    const result = await model.generateContent(prompt, requestOptions);
    const text = result?.response?.text?.() ?? '';

    process.stdout.write(JSON.stringify({ ok: true, text }));
    process.exit(0);
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err?.message ? String(err.message) : String(err) }));
    process.exit(1);
  }
})();
