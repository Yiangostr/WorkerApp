import { openai, DEFAULT_MODEL } from './client.js';
import { parseComputeResponse } from './schemas.js';

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
): Promise<{ result: number; llmResponse: string; usedFallback: boolean }> {
  const symbol = operationSymbols[operation];
  const prompt = `Calculate ${a} ${symbol} ${b}. Respond ONLY with JSON: {"result": <number>}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a precise calculator. Respond only with valid JSON containing the numeric result. Example: {"result": 42}',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_tokens: 100,
    });

    const choice = response.choices[0]?.message;
    const llmResponse =
      choice?.content ||
      (choice as unknown as { reasoning_content?: string })?.reasoning_content ||
      '';

    console.log(`[LLM] Raw response for ${a} ${symbol} ${b}:`, llmResponse);

    const parsed = parseComputeResponse(llmResponse);

    console.log(`[LLM] ${a} ${symbol} ${b} = ${parsed.result} (from ${DEFAULT_MODEL})`);

    return { result: parsed.result, llmResponse, usedFallback: false };
  } catch (error) {
    console.error('[LLM] Error, using fallback:', error);
    const result = computeDeterministic(a, b, operation);
    return {
      result,
      llmResponse: `Fallback: ${error instanceof Error ? error.message : 'LLM unavailable'}`,
      usedFallback: true,
    };
  }
}
