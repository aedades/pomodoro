import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStats, formatDuration } from './useStats'
import { GuestPomodoro, GuestTask, GuestProject } from './useLocalStorage'

describe('useStats', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const mockProjects: GuestProject[] = [
    { id: 'p1', name: 'Work', color: '#ff0000', completed: false, createdAt: '2024-01-01' },
    { id: 'p2', name: 'Personal', color: '#00ff00', completed: false, createdAt: '2024-01-01' },
  ]
  
  const mockTasks: GuestTask[] = [
    { id: 't1', title: 'Task 1', projectId: 'p1', completed: true, estimatedPomodoros: 2, actualPomodoros: 3, createdAt: '2024-01-01' },
    { id: 't2', title: 'Task 2', projectId: 'p2', completed: false, estimatedPomodoros: 4, actualPomodoros: 1, createdAt: '2024-01-01' },
  ]
  
  it('calculates totals correctly', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
      { id: '3', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: true },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.totalPomodoros).toBe(2)
    expect(result.current.totalInterrupted).toBe(1)
    expect(result.current.totalMinutes).toBe(50)
    expect(result.current.completionRate).toBe(67) // 2/3 = 66.67%
  })
  
  it('handles empty data', () => {
    const { result } = renderHook(() => useStats([], [], []))
    
    expect(result.current.totalPomodoros).toBe(0)
    expect(result.current.totalMinutes).toBe(0)
    expect(result.current.completionRate).toBe(100)
    expect(result.current.currentStreak).toBe(0)
    expect(result.current.longestStreak).toBe(0)
  })
  
  it('calculates today stats', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.today.date).toBe(today)
    expect(result.current.today.completed).toBe(2)
    expect(result.current.today.totalMinutes).toBe(50)
  })
  
  it('calculates project breakdown', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
      { id: '3', taskId: 't2', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.byProject).toHaveLength(2)
    expect(result.current.byProject[0].projectName).toBe('Work')
    expect(result.current.byProject[0].pomodoros).toBe(2)
    expect(result.current.byProject[1].projectName).toBe('Personal')
    expect(result.current.byProject[1].pomodoros).toBe(1)
  })
  
  it('calculates streaks correctly', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
    
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: yesterday, completedAt: `${yesterday}T10:00:00`, interrupted: false },
      { id: '3', taskId: 't1', durationMinutes: 25, startedAt: twoDaysAgo, completedAt: `${twoDaysAgo}T10:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.currentStreak).toBe(3)
    expect(result.current.longestStreak).toBe(3)
  })
  
  it('calculates estimation accuracy', () => {
    const tasks: GuestTask[] = [
      { id: 't1', title: 'Task 1', completed: true, estimatedPomodoros: 2, actualPomodoros: 4, createdAt: '2024-01-01' }, // 200% - underestimated
      { id: 't2', title: 'Task 2', completed: true, estimatedPomodoros: 4, actualPomodoros: 2, createdAt: '2024-01-01' }, // 50% - overestimated
    ]
    // Total: estimated 6, actual 6 => 100%
    
    const { result } = renderHook(() => useStats([], tasks, []))
    
    expect(result.current.estimateAccuracy).toBe(100)
  })
  
  it('returns thisWeek with 7 days', () => {
    const { result } = renderHook(() => useStats([], [], []))
    
    expect(result.current.thisWeek).toHaveLength(7)
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m')
  })
  
  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
  
  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2h')
  })
  
  it('formats large durations', () => {
    expect(formatDuration(185)).toBe('3h 5m')
  })
})
