import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IOSInstructions, IOSInstallBanner } from './IOSInstructions';
import * as deviceDetect from '../lib/deviceDetect';

// Mock the deviceDetect module
vi.mock('../lib/deviceDetect', () => ({
  getDeviceInfo: vi.fn(),
}));

describe('IOSInstructions', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns null for non-iOS devices', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: false,
      isIOSSafari: false,
      isPWA: false,
      iosVersion: null,
      supportsWebPush: true,
      needsPWAInstall: false,
      needsIOSUpdate: false,
    });

    const { container } = render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="default" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when everything is set up (PWA + granted)', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: true,
      iosVersion: 17,
      supportsWebPush: true,
      needsPWAInstall: false,
      needsIOSUpdate: false,
    });

    const { container } = render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="granted" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows iOS update message for old iOS versions', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 15,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: true,
    });

    render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="default" />
    );

    expect(screen.getByText(/iOS Update Required/i)).toBeInTheDocument();
    expect(screen.getByText(/iOS 16.4 or later/i)).toBeInTheDocument();
  });

  it('shows Add to Home Screen instructions for iOS not installed as PWA', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="default" />
    );

    // Use getAllByText since there are multiple matches
    const headings = screen.getAllByText(/Add to Home Screen/i);
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getByText(/Share button/i)).toBeInTheDocument();
  });

  it('shows Enable Notifications for PWA without permission', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: true,
      iosVersion: 17,
      supportsWebPush: true,
      needsPWAInstall: false,
      needsIOSUpdate: false,
    });

    render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="default" />
    );

    // Use getAllByText since heading and button both contain the text
    const elements = screen.getAllByText(/Enable Notifications/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    render(
      <IOSInstructions onDismiss={mockOnDismiss} notificationPermission="default" />
    );

    fireEvent.click(screen.getByText(/I'll do this later/i));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('IOSInstallBanner', () => {
  const mockOnTap = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns null for non-iOS devices', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: false,
      isIOSSafari: false,
      isPWA: false,
      iosVersion: null,
      supportsWebPush: true,
      needsPWAInstall: false,
      needsIOSUpdate: false,
    });

    const { container } = render(<IOSInstallBanner onTap={mockOnTap} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner for iOS not installed as PWA', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    render(<IOSInstallBanner onTap={mockOnTap} />);
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
  });

  it('returns null when already installed as PWA', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: true,
      iosVersion: 17,
      supportsWebPush: true,
      needsPWAInstall: false,
      needsIOSUpdate: false,
    });

    const { container } = render(<IOSInstallBanner onTap={mockOnTap} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onTap when banner is clicked', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    render(<IOSInstallBanner onTap={mockOnTap} />);
    fireEvent.click(screen.getByText(/Add to Home Screen/i));
    expect(mockOnTap).toHaveBeenCalledTimes(1);
  });

  it('dismisses and saves to localStorage when X is clicked', () => {
    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    render(<IOSInstallBanner onTap={mockOnTap} />);
    fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(localStorage.getItem('ios-install-banner-dismissed')).toBe('true');
  });

  it('does not show banner if previously dismissed', () => {
    localStorage.setItem('ios-install-banner-dismissed', 'true');

    vi.mocked(deviceDetect.getDeviceInfo).mockReturnValue({
      isIOS: true,
      isIOSSafari: true,
      isPWA: false,
      iosVersion: 17,
      supportsWebPush: false,
      needsPWAInstall: true,
      needsIOSUpdate: false,
    });

    const { container } = render(<IOSInstallBanner onTap={mockOnTap} />);
    expect(container.firstChild).toBeNull();
  });
});
