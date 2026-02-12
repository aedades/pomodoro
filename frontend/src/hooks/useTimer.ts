import { useState, useEffect, useCallback, useRef } from 'react'
import type { Settings } from './useSettings'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface UseTimerOptions {
  settings: Settings
  onComplete: (mode: TimerMode, interrupted: boolean) => void
}

// Base64 encoded simple beep sound
const BEEP_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkpONgXVsaW59ipujo5yCbWBdaHqMnqqtoJF+bWBgaoKUpKutpJF9bV5fa4OUp6yspZKAb2JjaICQoKWlnpF/cGRmaYGQn6SkmZB+b2ZpbIKTn6OjmI58bmlscYaVoKKhlo17cG1vdImYoaGgk4t3b29ze42boaCfjYl1cHF3fJCdoJ6diod0cXR6gJKen52chYNzcnd8g5Senp2ZgYBycnl/hpWcnJqXf3xxc3qBiZOam5mVfntxdHuDi5OZmZaUfHpwdHuDjJOYl5aSenhvc3qDjZKXlpWRd3Zuc3qFjpOWlZSOdXNscnmFj5KVlJKNc3FrcXiFkJKUk5GMcm9rcXiGkJKUk5CLcW5rcXiGkJKUk5CKcG1rcXmHkZOUk5CKb2xrcXmHkZOUk5CJbmtrcXmHkpSUk5CJbWprcXqIkpSUk5CIbGlqcXqIk5SUk5CHa2hqcXuJk5WVk5GHamhpcXuJlJaVk5GGaGdpcXyKlJaVk5GFZ2ZpcXyKlZeVk5GEZmVpcXyLlZeVk5GDZWRpcX2LlpiWk5GCZGNpcX2Ml5mWk5GAZWJ='

export function useTimer({ settings, onComplete }: UseTimerOptions) {
  const [mode, setMode] = useState<TimerMode>('work')
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  
  // For countdown mode: end time
  const [endTime, setEndTime] = useState<number | null>(null)
  // For flow mode: start time (count up)
  const [startTime, setStartTime] = useState<number | null>(null)
  // Displayed time (seconds)
  const [timeLeft, setTimeLeft] = useState(settings.work_duration_minutes * 60)
  // For flow mode: elapsed time
  const [elapsed, setElapsed] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  const completedRef = useRef(false)

  // Is this a flow mode session? (only applies to work mode)
  const isFlowMode = settings.flow_mode_enabled && mode === 'work'

  const getDuration = useCallback(
    (m: TimerMode) => {
      switch (m) {
        case 'work':
          return settings.work_duration_minutes * 60
        case 'shortBreak':
          return settings.short_break_minutes * 60
        case 'longBreak':
          return settings.long_break_minutes * 60
      }
    },
    [settings]
  )

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(BEEP_SOUND)
    audioRef.current.volume = 0.5
  }, [])

  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current || !audioRef.current) return
    audioRef.current.play().then(() => {
      audioRef.current?.pause()
      audioRef.current!.currentTime = 0
      audioUnlockedRef.current = true
    }).catch(() => {})
  }, [])

  const playSound = useCallback(() => {
    if (!settings.sound_enabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }, [settings.sound_enabled])

  const showNotification = useCallback(
    (title: string, body: string) => {
      if (!settings.notifications_enabled) return
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/tomato.svg' })
      }
    },
    [settings.notifications_enabled]
  )

  // Handle countdown completion (non-flow mode)
  const handleCountdownComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    
    setIsRunning(false)
    setEndTime(null)
    onComplete(mode, false)
    playSound()

    if (mode === 'work') {
      const newCount = sessionCount + 1
      setSessionCount(newCount)

      const isLongBreak = newCount % settings.long_break_interval === 0
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak'

      showNotification(
        'Pomodoro Complete! 🍅',
        isLongBreak ? 'Time for a long break!' : 'Time for a short break!'
      )

      setMode(nextMode)
      const nextDuration = getDuration(nextMode)
      setTimeLeft(nextDuration)
      
      if (settings.auto_start_breaks) {
        setEndTime(Date.now() + nextDuration * 1000)
        setIsRunning(true)
        completedRef.current = false
      }
    } else {
      showNotification('Break Over!', 'Ready to focus again?')
      setMode('work')
      const workDuration = getDuration('work')
      setTimeLeft(workDuration)
      setElapsed(0)
      
      if (settings.auto_start_breaks) {
        if (settings.flow_mode_enabled) {
          setStartTime(Date.now())
        } else {
          setEndTime(Date.now() + workDuration * 1000)
        }
        setIsRunning(true)
        completedRef.current = false
      }
    }
  }, [mode, sessionCount, settings, onComplete, playSound, showNotification, getDuration])

  // Stop flow mode session (user manually stops)
  const stopFlowSession = useCallback(() => {
    if (!isFlowMode || !isRunning) return
    
    setIsRunning(false)
    setStartTime(null)
    
    const targetSeconds = settings.work_duration_minutes * 60
    
    // Only count as complete if elapsed >= target
    if (elapsed >= targetSeconds) {
      onComplete('work', false)
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      
      // Move to break
      const isLongBreak = newCount % settings.long_break_interval === 0
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak'
      setMode(nextMode)
      setTimeLeft(getDuration(nextMode))
      setElapsed(0)
    } else {
      // Didn't hit target - treat as interrupted
      onComplete('work', true)
      setTimeLeft(targetSeconds)
      setElapsed(0)
    }
  }, [isFlowMode, isRunning, elapsed, settings, sessionCount, onComplete, getDuration])

  const resetTimer = useCallback(
    (newMode: TimerMode, autoStart = false) => {
      const duration = getDuration(newMode)
      setMode(newMode)
      setTimeLeft(duration)
      setElapsed(0)
      setIsRunning(autoStart)
      completedRef.current = false
      
      if (autoStart) {
        if (settings.flow_mode_enabled && newMode === 'work') {
          setStartTime(Date.now())
          setEndTime(null)
        } else {
          setEndTime(Date.now() + duration * 1000)
          setStartTime(null)
        }
      } else {
        setEndTime(null)
        setStartTime(null)
      }
    },
    [getDuration, settings.flow_mode_enabled]
  )

  const toggle = useCallback(() => {
    unlockAudio()
    
    if (isRunning) {
      if (isFlowMode) {
        // Stop flow session
        stopFlowSession()
      } else {
        // Pause countdown
        if (endTime) {
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
          setTimeLeft(remaining)
        }
        setEndTime(null)
        setStartTime(null)
        setIsRunning(false)
      }
    } else {
      // Start
      completedRef.current = false
      if (isFlowMode) {
        // Flow mode: count up
        setStartTime(Date.now())
        setEndTime(null)
        setElapsed(0)
      } else {
        // Countdown mode
        setEndTime(Date.now() + timeLeft * 1000)
        setStartTime(null)
      }
      setIsRunning(true)
    }
  }, [unlockAudio, isRunning, isFlowMode, endTime, timeLeft, stopFlowSession])

  const interrupt = useCallback(() => {
    if (mode === 'work' && isRunning) {
      onComplete(mode, true)
    }
    resetTimer(mode)
  }, [mode, isRunning, onComplete, resetTimer])

  // Timer tick
  useEffect(() => {
    if (!isRunning) return

    const tick = () => {
      if (isFlowMode && startTime) {
        // Flow mode: count up
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        setElapsed(elapsedSeconds)
      } else if (endTime) {
        // Countdown mode
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
          handleCountdownComplete()
        }
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isRunning, isFlowMode, startTime, endTime, handleCountdownComplete])

  // Recalculate on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        if (isFlowMode && startTime) {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          setElapsed(elapsedSeconds)
        } else if (endTime) {
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
          setTimeLeft(remaining)
          if (remaining <= 0) {
            handleCountdownComplete()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning, isFlowMode, startTime, endTime, handleCountdownComplete])

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && 
        settings.notifications_enabled && 
        Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [settings.notifications_enabled])

  // Update duration when settings change (only if not running)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDuration(mode))
      setElapsed(0)
    }
  }, [getDuration, mode, isRunning])

  // Display time depends on mode
  const displayTime = isFlowMode ? elapsed : timeLeft
  const targetTime = getDuration('work')
  const isOverTarget = isFlowMode && elapsed >= targetTime

  return {
    mode,
    timeLeft: displayTime,
    isRunning,
    sessionCount,
    toggle,
    resetTimer,
    interrupt,
    setMode: (m: TimerMode) => resetTimer(m),
    // Flow mode specific
    isFlowMode,
    elapsed,
    isOverTarget,
    targetTime,
  }
}
