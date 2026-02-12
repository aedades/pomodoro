import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyProgress from './DailyProgress';

describe('DailyProgress', () => {
  it('renders with progress text', () => {
    render(<DailyProgress current={3} goal={8} />);
    // The component renders "3 / 8 🍅" with spaces
    expect(screen.getByText(/Today's Progress/i)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<DailyProgress current={4} goal={8} />);
    const progressBar = document.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows 100% when goal is reached', () => {
    render(<DailyProgress current={8} goal={8} />);
    const progressBar = document.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByText(/Daily goal reached/i)).toBeInTheDocument();
  });

  it('caps progress at 100% when exceeding goal', () => {
    render(<DailyProgress current={10} goal={8} />);
    const progressBar = document.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows 0% when no pomodoros completed', () => {
    render(<DailyProgress current={0} goal={8} />);
    const progressBar = document.querySelector('[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
