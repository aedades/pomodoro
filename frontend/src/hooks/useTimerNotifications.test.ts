import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerNotifications } from './useTimerNotifications'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  app: null,
  isFirebaseConfigured: false,
}))

// Mock useNotifications
vi.mock('./useNotifications', () => ({
  useNotifications: () => ({
    token: null,
    requestPermission: vi.fn().mockResolvedValue(null),
    permission: 'default',
    supported: true,
  }),
}))

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}))

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}))

describe('useTimerNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes scheduleNotification and cancelNotification functions', () => {
    const { result } = renderHook(() => useTimerNotifications())

    expect(typeof result.current.scheduleNotification).toBe('function')
    expect(typeof result.current.cancelNotification).toBe('function')
    expect(typeof result.current.ensurePermission).toBe('function')
  })

  it('scheduleNotification returns null when Firebase not configured', async () => {
    const { result } = renderHook(() => useTimerNotifications())

    let returnValue: string | null = null
    await act(async () => {
      returnValue = await result.current.scheduleNotification(25 * 60 * 1000, 'focus')
    })

    expect(returnValue).toBeNull()
  })

  it('scheduleNotification returns null when user not authenticated', async () => {
    const { result } = renderHook(() => useTimerNotifications())

    let returnValue: string | null = null
    await act(async () => {
      returnValue = await result.current.scheduleNotification(25 * 60 * 1000, 'focus')
    })

    expect(returnValue).toBeNull()
  })

  it('cancelNotification does not throw when no active timer', async () => {
    const { result } = renderHook(() => useTimerNotifications())

    // Should not throw
    await act(async () => {
      await result.current.cancelNotification()
    })
  })

  it('ensurePermission returns false when no token', async () => {
    const { result } = renderHook(() => useTimerNotifications())

    let hasPermission = true
    await act(async () => {
      hasPermission = await result.current.ensurePermission()
    })

    expect(hasPermission).toBe(false)
  })

  it('reports hasPermission false when permission not granted', () => {
    const { result } = renderHook(() => useTimerNotifications())

    expect(result.current.hasPermission).toBe(false)
  })

  it('reports isFirebaseConfigured as false when not configured', () => {
    const { result } = renderHook(() => useTimerNotifications())

    expect(result.current.isFirebaseConfigured).toBe(false)
  })
})
