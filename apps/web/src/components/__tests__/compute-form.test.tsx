import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComputeForm } from '../compute-form';

describe('ComputeForm', () => {
  it('renders number inputs and compute button', () => {
    render(<ComputeForm onCompute={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText(/number a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number b/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compute/i })).toBeInTheDocument();
  });

  it('disables button when inputs are empty', () => {
    render(<ComputeForm onCompute={vi.fn()} isLoading={false} />);

    const button = screen.getByRole('button', { name: /compute/i });
    expect(button).toBeDisabled();
  });

  it('enables button when both inputs have valid numbers', () => {
    render(<ComputeForm onCompute={vi.fn()} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/number a/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/number b/i), { target: { value: '5' } });

    const button = screen.getByRole('button', { name: /compute/i });
    expect(button).toBeEnabled();
  });

  it('calls onCompute with parsed numbers when form is submitted', () => {
    const onCompute = vi.fn();
    render(<ComputeForm onCompute={onCompute} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/number a/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/number b/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));

    expect(onCompute).toHaveBeenCalledWith(10, 5);
  });

  it('handles floating point numbers', () => {
    const onCompute = vi.fn();
    render(<ComputeForm onCompute={onCompute} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/number a/i), { target: { value: '3.14' } });
    fireEvent.change(screen.getByLabelText(/number b/i), { target: { value: '2.71' } });
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));

    expect(onCompute).toHaveBeenCalledWith(3.14, 2.71);
  });

  it('shows loading state when isLoading is true', () => {
    render(<ComputeForm onCompute={vi.fn()} isLoading={true} />);

    expect(screen.getByRole('button', { name: /computing/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables inputs when disabled prop is true', () => {
    render(<ComputeForm onCompute={vi.fn()} isLoading={false} disabled={true} />);

    expect(screen.getByLabelText(/number a/i)).toBeDisabled();
    expect(screen.getByLabelText(/number b/i)).toBeDisabled();
  });

  it('handles negative numbers', () => {
    const onCompute = vi.fn();
    render(<ComputeForm onCompute={onCompute} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/number a/i), { target: { value: '-10' } });
    fireEvent.change(screen.getByLabelText(/number b/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));

    expect(onCompute).toHaveBeenCalledWith(-10, 5);
  });
});
