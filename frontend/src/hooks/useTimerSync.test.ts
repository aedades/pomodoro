import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerSync } from './useTimerSync'

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  db: null,
  isFirebaseConfigured: false,
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}), // Returns unsubscribe function
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}))

describe('useTimerSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null remoteState when user is not signed in', () => {
    const { result } = renderHook(() => useTimerSync())

    expect(result.current.remoteState).toBeNull()
    expect(result.current.isSyncEnabled).toBe(false)
  })

  it('returns isLoading false when not signed in', () => {
    const { result } = renderHook(() => useTimerSync())

    expect(result.current.isLoading).toBe(false)
  })

  it('exposes syncTimerState function', () => {
    const { result } = renderHook(() => useTimerSync())

    expect(typeof result.current.syncTimerState).toBe('function')
  })

  it('syncTimerState does not throw when not signed in', async () => {
    const { result } = renderHook(() => useTimerSync())

    // Should not throw
    await act(async () => {
      await result.current.syncTimerState({
        isRunning: true,
        mode: 'work',
        endTime: Date.now() + 25 * 60 * 1000,
        startTime: null,
        sessionCount: 0,
        pausedTimeLeft: null,
      })
    })
  })

  it('isSyncEnabled is false when Firebase not configured', () => {
    const { result } = renderHook(() => useTimerSync())

    expect(result.current.isSyncEnabled).toBe(false)
  })
})

describe('useTimerSync with signed-in user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Override mock to simulate signed-in user
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: { id: 'test-user-123' },
      }),
    }))
  })

  it('isSyncEnabled depends on user and Firebase config', async () => {
    // Reset modules to pick up new mock
    vi.resetModules()
    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: { id: 'test-user-123' },
      }),
    }))
    vi.doMock('../lib/firebase', () => ({
      db: {}, // Mock db exists
      isFirebaseConfigured: true,
    }))

    const { useTimerSync: useTimerSyncMocked } = await import('./useTimerSync')
    const { result } = renderHook(() => useTimerSyncMocked())

    // With user and Firebase configured, sync should be enabled
    expect(result.current.isSyncEnabled).toBe(true)
  })
})
