import { describe, it, expect } from 'vitest';
import { computeDeterministic } from '../compute';
import { parseComputeResponse, parseJsonFromResponse } from '../schemas';

describe('computeDeterministic', () => {
  it('should add two numbers', () => {
    expect(computeDeterministic(10, 5, 'ADD')).toBe(15);
  });

  it('should subtract two numbers', () => {
    expect(computeDeterministic(10, 5, 'SUBTRACT')).toBe(5);
  });

  it('should multiply two numbers', () => {
    expect(computeDeterministic(10, 5, 'MULTIPLY')).toBe(50);
  });

  it('should divide two numbers', () => {
    expect(computeDeterministic(10, 5, 'DIVIDE')).toBe(2);
  });

  it('should handle floating point addition', () => {
    expect(computeDeterministic(0.1, 0.2, 'ADD')).toBeCloseTo(0.3);
  });

  it('should handle negative numbers', () => {
    expect(computeDeterministic(-10, 5, 'ADD')).toBe(-5);
    expect(computeDeterministic(-10, -5, 'MULTIPLY')).toBe(50);
  });

  it('should throw on division by zero', () => {
    expect(() => computeDeterministic(10, 0, 'DIVIDE')).toThrow('Division by zero');
  });
});

describe('parseJsonFromResponse', () => {
  it('should extract JSON from plain response', () => {
    const result = parseJsonFromResponse('{"result": 15}');
    expect(result).toEqual({ result: 15 });
  });

  it('should extract JSON from text with surrounding content', () => {
    const result = parseJsonFromResponse('The answer is {"result": 42} as calculated.');
    expect(result).toEqual({ result: 42 });
  });

  it('should throw if no JSON found', () => {
    expect(() => parseJsonFromResponse('No JSON here')).toThrow('No JSON found');
  });
});

describe('parseComputeResponse', () => {
  it('should parse valid compute response', () => {
    const result = parseComputeResponse('{"result": 15}');
    expect(result).toEqual({ result: 15 });
  });

  it('should parse response with floating point', () => {
    const result = parseComputeResponse('{"result": 3.14159}');
    expect(result).toEqual({ result: 3.14159 });
  });

  it('should throw on invalid response', () => {
    expect(() => parseComputeResponse('{"wrong": "field"}')).toThrow();
  });

  it('should throw on non-numeric result', () => {
    expect(() => parseComputeResponse('{"result": "not a number"}')).toThrow();
  });
});
