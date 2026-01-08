import { z } from 'zod';

export const ComputeResponseSchema = z.object({
  result: z.number(),
});

export type ComputeResponse = z.infer<typeof ComputeResponseSchema>;

export function parseJsonFromResponse(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  return JSON.parse(jsonMatch[0]);
}

export function parseComputeResponse(text: string): ComputeResponse {
  const parsed = parseJsonFromResponse(text);
  return ComputeResponseSchema.parse(parsed);
}
