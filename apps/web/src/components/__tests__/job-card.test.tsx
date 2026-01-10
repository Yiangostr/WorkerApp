import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from '../job-card';

describe('JobCard', () => {
  const defaultProps = {
    operation: 'ADD',
    status: 'PENDING',
    result: null,
    error: null,
    numberA: 10,
    numberB: 5,
  };

  it('renders operation label', () => {
    render(<JobCard {...defaultProps} />);
    expect(screen.getByText('A + B')).toBeInTheDocument();
  });

  it('shows expression with correct symbol', () => {
    render(<JobCard {...defaultProps} />);
    expect(screen.getByText('10 + 5')).toBeInTheDocument();
  });

  it('shows pending state correctly', () => {
    render(<JobCard {...defaultProps} status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows in-progress state correctly', () => {
    render(<JobCard {...defaultProps} status="IN_PROGRESS" />);
    expect(screen.getByText('Computing...')).toBeInTheDocument();
  });

  it('shows completed state with result', () => {
    render(<JobCard {...defaultProps} status="COMPLETED" result={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('formats large numbers with locale string', () => {
    render(<JobCard {...defaultProps} status="COMPLETED" result={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('shows failed state with error message', () => {
    render(<JobCard {...defaultProps} status="FAILED" error="Division by zero" />);
    expect(screen.getByText('Division by zero')).toBeInTheDocument();
  });

  it('shows generic error when failed without message', () => {
    render(<JobCard {...defaultProps} status="FAILED" error={null} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders subtract operation correctly', () => {
    render(<JobCard {...defaultProps} operation="SUBTRACT" />);
    expect(screen.getByText('A - B')).toBeInTheDocument();
    expect(screen.getByText('10 - 5')).toBeInTheDocument();
  });

  it('renders multiply operation correctly', () => {
    render(<JobCard {...defaultProps} operation="MULTIPLY" />);
    expect(screen.getByText('A × B')).toBeInTheDocument();
    expect(screen.getByText('10 × 5')).toBeInTheDocument();
  });

  it('renders divide operation correctly', () => {
    render(<JobCard {...defaultProps} operation="DIVIDE" />);
    expect(screen.getByText('A ÷ B')).toBeInTheDocument();
    expect(screen.getByText('10 ÷ 5')).toBeInTheDocument();
  });

  it('handles decimal results correctly', () => {
    render(<JobCard {...defaultProps} status="COMPLETED" result={3.14159} />);
    expect(screen.getByText('3.1416')).toBeInTheDocument();
  });
});
