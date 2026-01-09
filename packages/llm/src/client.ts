import OpenAI from 'openai';

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

function getOpenAIClient(): OpenAI {
  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({
      apiKey: process.env.LLM_API_KEY ?? 'test-key',
      baseURL: process.env.LLM_BASE_URL ?? 'https://api.z.ai/api/coding/paas/v4/',
    });
  }
  return globalForOpenAI.openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return getOpenAIClient()[prop as keyof OpenAI];
  },
});

export const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'glm-4.5';

export { OpenAI };
