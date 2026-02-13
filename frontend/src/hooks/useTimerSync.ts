import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

export type TimerMode = 'work' | 'shortBreak' | 'longBreak'

export interface TimerState {
  isRunning: boolean
  mode: TimerMode
  endTime: number | null      // For countdown mode (ms since epoch)
  startTime: number | null    // For flow mode (ms since epoch)
  sessionCount: number
  pausedTimeLeft: number | null  // Seconds remaining when paused
}

const DEFAULT_TIMER_STATE: TimerState = {
  isRunning: false,
  mode: 'work',
  endTime: null,
  startTime: null,
  sessionCount: 0,
  pausedTimeLeft: null,
}

/**
 * Hook to sync timer state across devices via Firestore.
 * Returns remote state and a function to update it.
 */
export function useTimerSync() {
  const { user } = useAuth()
  const [remoteState, setRemoteState] = useState<TimerState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastUpdateRef = useRef<number>(0)

  // Listen for remote timer state changes
  useEffect(() => {
    if (!user || !db || !isFirebaseConfigured) {
      setRemoteState(null)
      setIsLoading(false)
      return
    }

    const timerRef = doc(db, 'users', user.id, 'timerState', 'current')
    
    const unsubscribe = onSnapshot(
      timerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as TimerState & { updatedAt?: { toMillis?: () => number } }
          // Ignore updates we just made (prevent loops)
          const remoteUpdatedAt = data.updatedAt?.toMillis?.() ?? 0
          if (remoteUpdatedAt > lastUpdateRef.current + 1000) {
            setRemoteState({
              isRunning: data.isRunning,
              mode: data.mode,
              endTime: data.endTime,
              startTime: data.startTime,
              sessionCount: data.sessionCount,
              pausedTimeLeft: data.pausedTimeLeft,
            })
          }
        } else {
          setRemoteState(DEFAULT_TIMER_STATE)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Timer sync error:', error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Update remote timer state
  const syncTimerState = useCallback(
    async (state: TimerState) => {
      if (!user || !db || !isFirebaseConfigured) return

      lastUpdateRef.current = Date.now()
      const timerRef = doc(db, 'users', user.id, 'timerState', 'current')

      try {
        await setDoc(timerRef, {
          ...state,
          updatedAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('Failed to sync timer state:', error)
      }
    },
    [user]
  )

  return {
    remoteState,
    syncTimerState,
    isLoading,
    isSyncEnabled: !!user && isFirebaseConfigured,
  }
}
