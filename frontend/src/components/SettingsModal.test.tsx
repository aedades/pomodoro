import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
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

  const mockOnUpdate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all timer duration inputs', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/work/i)).toHaveValue(25);
    expect(screen.getByLabelText(/short break/i)).toHaveValue(5);
    expect(screen.getByLabelText(/long break/i)).toHaveValue(15);
  });

  it('renders daily goal input', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/daily pomodoro goal/i)).toHaveValue(8);
  });

  it('renders all toggle switches', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/auto-start breaks/i)).toBeInTheDocument();
    expect(screen.getByText(/sound notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/browser notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
    expect(screen.getByText(/enable flow mode/i)).toBeInTheDocument();
  });

  it('calls onUpdate when work duration changes', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const workInput = screen.getByLabelText(/work/i);
    fireEvent.change(workInput, { target: { value: '30' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ work_duration_minutes: 30 });
  });

  it('calls onUpdate when short break duration changes', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const shortBreakInput = screen.getByLabelText(/short break/i);
    fireEvent.change(shortBreakInput, { target: { value: '10' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ short_break_minutes: 10 });
  });

  it('calls onUpdate when daily goal changes', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const goalInput = screen.getByLabelText(/daily pomodoro goal/i);
    fireEvent.change(goalInput, { target: { value: '12' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ daily_pomodoro_goal: 12 });
  });

  it('calls onUpdate when auto-start breaks is toggled', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const autoStartToggle = screen.getByText(/auto-start breaks/i).closest('div')?.querySelector('button');
    if (autoStartToggle) {
      fireEvent.click(autoStartToggle);
    }

    expect(mockOnUpdate).toHaveBeenCalledWith({ auto_start_breaks: true });
  });

  it('calls onUpdate when flow mode is toggled', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const flowModeToggle = screen.getByText(/enable flow mode/i).closest('div')?.querySelector('button');
    if (flowModeToggle) {
      fireEvent.click(flowModeToggle);
    }

    expect(mockOnUpdate).toHaveBeenCalledWith({ flow_mode_enabled: true });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('✕'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Done button is clicked', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Done'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays flow mode description', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/timer counts up from 0/i)).toBeInTheDocument();
    expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
  });

  it('shows long break interval input', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/long break after/i)).toBeInTheDocument();
    const intervalInput = screen.getByDisplayValue('4');
    expect(intervalInput).toBeInTheDocument();
  });

  it('reflects current settings state', () => {
    const customSettings = {
      ...defaultSettings,
      work_duration_minutes: 45,
      dark_mode: true,
      flow_mode_enabled: true,
    };

    render(
      <SettingsModal
        settings={customSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/work/i)).toHaveValue(45);
  });
});
