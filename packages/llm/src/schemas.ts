import { z } from 'zod';

export const ComputeResponseSchema = z.object({
  result: z.number(),
});

export type ComputeResponse = z.infer<typeof ComputeResponseSchema>;

export function parseJsonFromResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  const numberMatch = text.match(/-?\d+\.?\d*/);
  if (numberMatch) {
    return { result: parseFloat(numberMatch[0]) };
  }

  throw new Error(`No JSON or number found in response: ${text.slice(0, 100)}`);
}

export function parseComputeResponse(text: string): ComputeResponse {
  const parsed = parseJsonFromResponse(text);
  return ComputeResponseSchema.parse(parsed);
}
