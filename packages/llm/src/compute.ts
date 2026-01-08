import { openai, DEFAULT_MODEL } from './client';
import { parseComputeResponse } from './schemas';

export type Operation = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';

const operationSymbols: Record<Operation, string> = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
};

export function computeDeterministic(a: number, b: number, operation: Operation): number {
  switch (operation) {
    case 'ADD':
      return a + b;
    case 'SUBTRACT':
      return a - b;
    case 'MULTIPLY':
      return a * b;
    case 'DIVIDE':
      if (b === 0) throw new Error('Division by zero');
      return a / b;
  }
}

export async function computeWithLLM(
  a: number,
  b: number,
  operation: Operation
): Promise<{ result: number; llmResponse: string | null; usedFallback: boolean }> {
  const symbol = operationSymbols[operation];
  const prompt = `Calculate ${a} ${symbol} ${b}. Respond ONLY with JSON: {"result": <number>}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a calculator. Respond only with valid JSON containing the result.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const llmResponse = response.choices[0]?.message?.content ?? '';
    const parsed = parseComputeResponse(llmResponse);
    const expected = computeDeterministic(a, b, operation);

    if (Math.abs(parsed.result - expected) > 0.0001) {
      console.warn(
        `[LLM] Result mismatch: LLM=${parsed.result}, expected=${expected}. Using fallback.`
      );
      return { result: expected, llmResponse, usedFallback: true };
    }

    return { result: parsed.result, llmResponse, usedFallback: false };
  } catch (error) {
    console.error('[LLM] Error:', error);
    const result = computeDeterministic(a, b, operation);
    return {
      result,
      llmResponse: error instanceof Error ? error.message : 'Unknown error',
      usedFallback: true,
    };
  }
}
