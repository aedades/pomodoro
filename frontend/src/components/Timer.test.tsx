import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Timer from './Timer';

describe('Timer', () => {
  const defaultSettings = {
    work_duration_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    long_break_interval: 4,
    auto_start_breaks: false,
    sound_enabled: true,
    notifications_enabled: true,
    dark_mode: false,
    daily_pomodoro_goal: 8,
    flow_mode_enabled: false,
  };

  const defaultProps = {
    mode: 'work' as const,
    timeLeft: 1500, // 25 minutes
    isRunning: false,
    sessionCount: 0,
    activeTask: null,
    onToggle: vi.fn(),
    onReset: vi.fn(),
    onModeChange: vi.fn(),
    settings: defaultSettings,
  };

  it('renders the timer with correct time format', () => {
    render(<Timer {...defaultProps} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('formats single digit seconds correctly', () => {
    render(<Timer {...defaultProps} timeLeft={65} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('shows Start button when not running', () => {
    render(<Timer {...defaultProps} isRunning={false} />);
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('shows Pause button when running', () => {
    render(<Timer {...defaultProps} isRunning={true} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('calls onToggle when start/pause button is clicked', () => {
    const onToggle = vi.fn();
    render(<Timer {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn();
    render(<Timer {...defaultProps} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('displays active task name when provided', () => {
    render(<Timer {...defaultProps} activeTask="Write documentation" />);
    expect(screen.getByText('Write documentation')).toBeInTheDocument();
  });

  it('shows mode tabs', () => {
    render(<Timer {...defaultProps} />);
    expect(screen.getByRole('button', { name: /focus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /short break/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /long break/i })).toBeInTheDocument();
  });

  it('calls onModeChange when mode tab is clicked', () => {
    const onModeChange = vi.fn();
    render(<Timer {...defaultProps} onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /short break/i }));
    expect(onModeChange).toHaveBeenCalledWith('shortBreak');
  });

  it('highlights the active mode', () => {
    render(<Timer {...defaultProps} mode="shortBreak" />);
    const shortBreakButton = screen.getByRole('button', { name: /short break/i });
    // Check that it has the active styling (bg-white class indicates active)
    expect(shortBreakButton.className).toContain('bg-white');
  });

  it('renders with different time values', () => {
    const { rerender } = render(<Timer {...defaultProps} timeLeft={300} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();

    rerender(<Timer {...defaultProps} timeLeft={0} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(<Timer {...defaultProps} timeLeft={3599} />);
    expect(screen.getByText('59:59')).toBeInTheDocument();
  });
});
