import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStats, formatDuration } from './useStats'
import { GuestPomodoro, GuestTask, GuestProject } from './useLocalStorage'

describe('useStats', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const mockProjects: GuestProject[] = [
    { id: 'p1', name: 'Work', color: '#ff0000', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 'p2', name: 'Personal', color: '#00ff00', completed: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  ]
  
  const mockTasks: GuestTask[] = [
    { id: 't1', title: 'Task 1', projectId: 'p1', completed: true, estimatedPomodoros: 2, actualPomodoros: 3, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 't2', title: 'Task 2', projectId: 'p2', completed: false, estimatedPomodoros: 4, actualPomodoros: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
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
      { id: 't1', title: 'Task 1', completed: true, estimatedPomodoros: 2, actualPomodoros: 4, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // 200% - underestimated
      { id: 't2', title: 'Task 2', completed: true, estimatedPomodoros: 4, actualPomodoros: 2, createdAt: '2024-01-01', updatedAt: '2024-01-01' }, // 50% - overestimated
    ]
    // Total: estimated 6, actual 6 => 100%
    
    const { result } = renderHook(() => useStats([], tasks, []))
    
    expect(result.current.estimateAccuracy).toBe(100)
  })
  
  it('returns thisWeek with 7 days', () => {
    const { result } = renderHook(() => useStats([], [], []))
    
    expect(result.current.thisWeek).toHaveLength(7)
  })

  it('calculates productivity insights by day of week', () => {
    // Create pomodoros on different days
    const monday = new Date('2024-01-15T10:00:00') // Monday
    const tuesday = new Date('2024-01-16T14:00:00') // Tuesday
    
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: monday.toISOString(), completedAt: monday.toISOString(), interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: monday.toISOString(), completedAt: monday.toISOString(), interrupted: false },
      { id: '3', taskId: 't1', durationMinutes: 25, startedAt: tuesday.toISOString(), completedAt: tuesday.toISOString(), interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.insights.mostProductiveDay).toBe('Monday')
    expect(result.current.insights.peakDayCount).toBe(2)
    expect(result.current.insights.byDayOfWeek[1]).toBe(2) // Monday
    expect(result.current.insights.byDayOfWeek[2]).toBe(1) // Tuesday
  })

  it('calculates productivity insights by hour', () => {
    // Create pomodoros at different hours
    const morning = new Date('2024-01-15T09:30:00')
    const afternoon = new Date('2024-01-15T14:30:00')
    
    const pomodoros: GuestPomodoro[] = [
      { id: '1', taskId: 't1', durationMinutes: 25, startedAt: morning.toISOString(), completedAt: morning.toISOString(), interrupted: false },
      { id: '2', taskId: 't1', durationMinutes: 25, startedAt: morning.toISOString(), completedAt: morning.toISOString(), interrupted: false },
      { id: '3', taskId: 't1', durationMinutes: 25, startedAt: morning.toISOString(), completedAt: morning.toISOString(), interrupted: false },
      { id: '4', taskId: 't1', durationMinutes: 25, startedAt: afternoon.toISOString(), completedAt: afternoon.toISOString(), interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, mockTasks, mockProjects))
    
    expect(result.current.insights.mostProductiveHour).toBe('9 AM')
    expect(result.current.insights.peakHourCount).toBe(3)
    expect(result.current.insights.byHourOfDay[9]).toBe(3)
    expect(result.current.insights.byHourOfDay[14]).toBe(1)
  })

  it('returns null insights when no data', () => {
    const { result } = renderHook(() => useStats([], [], []))
    
    expect(result.current.insights.mostProductiveDay).toBeNull()
    expect(result.current.insights.mostProductiveHour).toBeNull()
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

describe('useStats - average pomodoro length', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0]
  
  it('calculates average pomodoro length for all time', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 45, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
      { id: '3', durationMinutes: 50, startedAt: today, completedAt: `${today}T12:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // (25 + 45 + 50) / 3 = 40
    expect(result.current.avgPomodoroLength).toBe(40)
  })
  
  it('calculates average pomodoro length for last 7 days only', () => {
    const pomodoros: GuestPomodoro[] = [
      // Old pomodoro (more than 7 days ago) - should not be included in lastWeek
      { id: '1', durationMinutes: 100, startedAt: eightDaysAgo, completedAt: `${eightDaysAgo}T10:00:00`, interrupted: false },
      // Recent pomodoros
      { id: '2', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '3', durationMinutes: 35, startedAt: yesterday, completedAt: `${yesterday}T10:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // All time: (100 + 25 + 35) / 3 = 53.33 ≈ 53
    expect(result.current.avgPomodoroLength).toBe(53)
    // Last 7 days: (25 + 35) / 2 = 30
    expect(result.current.avgPomodoroLengthLastWeek).toBe(30)
  })
  
  it('excludes interrupted pomodoros from average calculations', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 30, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 50, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
      { id: '3', durationMinutes: 5, startedAt: today, completedAt: `${today}T12:00:00`, interrupted: true }, // Should be excluded
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // (30 + 50) / 2 = 40 (not 28.33 if interrupted was included)
    expect(result.current.avgPomodoroLength).toBe(40)
    expect(result.current.avgPomodoroLengthLastWeek).toBe(40)
  })
  
  it('returns 0 when no completed pomodoros', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 5, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: true },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    expect(result.current.avgPomodoroLength).toBe(0)
    expect(result.current.avgPomodoroLengthLastWeek).toBe(0)
  })
  
  it('handles flow mode with variable durations correctly', () => {
    // Simulating a flow mode user with longer sessions
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 60, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 90, startedAt: today, completedAt: `${today}T12:00:00`, interrupted: false },
      { id: '3', durationMinutes: 45, startedAt: today, completedAt: `${today}T14:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // (60 + 90 + 45) / 3 = 65
    expect(result.current.avgPomodoroLength).toBe(65)
    // Total minutes should be actual sum
    expect(result.current.totalMinutes).toBe(195)
    // Completion rate should reflect all completed
    expect(result.current.totalPomodoros).toBe(3)
  })
})

describe('useStats - pomodoros without taskId', () => {
  const today = new Date().toISOString().split('T')[0]
  
  it('counts pomodoros without taskId', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 25, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
      { id: '3', taskId: undefined, durationMinutes: 25, startedAt: today, completedAt: `${today}T12:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    expect(result.current.totalPomodoros).toBe(3)
    expect(result.current.totalMinutes).toBe(75) // 3 * 25
  })
  
  it('includes taskless pomodoros in today stats', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 30, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 45, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    expect(result.current.today.completed).toBe(2)
    expect(result.current.today.totalMinutes).toBe(75)
  })
  
  it('groups taskless pomodoros as "No Project" in project breakdown', () => {
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
      { id: '2', durationMinutes: 25, startedAt: today, completedAt: today, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // Should have one entry for "No Project"
    const noProjectEntry = result.current.byProject.find(p => p.projectName === 'No Project')
    expect(noProjectEntry).toBeDefined()
    expect(noProjectEntry?.pomodoros).toBe(2)
  })
  
  it('calculates actual minutes in project breakdown (not assumed 25min)', () => {
    // Flow mode pomodoros with varying durations
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 45, startedAt: today, completedAt: today, interrupted: false },
      { id: '2', durationMinutes: 60, startedAt: today, completedAt: today, interrupted: false },
      { id: '3', durationMinutes: 30, startedAt: today, completedAt: today, interrupted: false },
    ]
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    const noProjectEntry = result.current.byProject.find(p => p.projectName === 'No Project')
    expect(noProjectEntry).toBeDefined()
    expect(noProjectEntry?.pomodoros).toBe(3)
    expect(noProjectEntry?.minutes).toBe(135) // 45 + 60 + 30, not 75 (3 * 25)
  })
})

describe('useStats - excludeWeekendsFromStreak', () => {
  // Helper to get date string for a specific day offset from a reference Monday
  const getDate = (baseMonday: Date, dayOffset: number): string => {
    const d = new Date(baseMonday)
    d.setDate(d.getDate() + dayOffset)
    return d.toISOString().split('T')[0]
  }
  
  // Use a fixed date for predictable tests (a Monday)
  const monday = new Date('2024-01-15T12:00:00') // This is a Monday
  
  it('includes weekends in streak by default', () => {
    // Mon, Tue, Wed, Thu, Fri, Sat, Sun (7 consecutive days)
    const pomodoros: GuestPomodoro[] = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      durationMinutes: 25,
      startedAt: getDate(monday, i),
      completedAt: `${getDate(monday, i)}T10:00:00`,
      interrupted: false,
    }))
    
    const { result } = renderHook(() => useStats(pomodoros, [], []))
    
    // All 7 days should count
    expect(result.current.longestStreak).toBe(7)
  })
  
  it('excludes weekends from streak when option enabled', () => {
    // Mon, Tue, Wed, Thu, Fri, Sat, Sun, Mon (8 consecutive calendar days = 6 weekdays)
    const pomodoros: GuestPomodoro[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${i}`,
      durationMinutes: 25,
      startedAt: getDate(monday, i),
      completedAt: `${getDate(monday, i)}T10:00:00`,
      interrupted: false,
    }))
    
    const { result } = renderHook(() => 
      useStats(pomodoros, [], [], { excludeWeekendsFromStreak: true })
    )
    
    // 8 calendar days but only 6 weekdays (skip Sat index 5 and Sun index 6)
    expect(result.current.longestStreak).toBe(6)
  })
  
  it('maintains streak over weekend gap when weekends excluded', () => {
    // Friday and following Monday only (no Sat/Sun activity)
    const friday = getDate(monday, 4) // Fri
    const nextMonday = getDate(monday, 7) // Next Mon
    
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: friday, completedAt: `${friday}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 25, startedAt: nextMonday, completedAt: `${nextMonday}T10:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => 
      useStats(pomodoros, [], [], { excludeWeekendsFromStreak: true })
    )
    
    // Friday + Monday should be a 2-day streak (weekend skipped)
    expect(result.current.longestStreak).toBe(2)
  })
  
  it('breaks streak for missing weekday when weekends excluded', () => {
    // Monday and Wednesday only (missing Tuesday)
    const wed = getDate(monday, 2) // Wed
    
    const pomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: getDate(monday, 0), completedAt: `${getDate(monday, 0)}T10:00:00`, interrupted: false },
      { id: '2', durationMinutes: 25, startedAt: wed, completedAt: `${wed}T10:00:00`, interrupted: false },
    ]
    
    const { result } = renderHook(() => 
      useStats(pomodoros, [], [], { excludeWeekendsFromStreak: true })
    )
    
    // Missing Tuesday breaks the streak - longest is 1
    expect(result.current.longestStreak).toBe(1)
  })
})

describe('useStats - reactivity', () => {
  const today = new Date().toISOString().split('T')[0]
  
  it('updates when pomodoros array changes', () => {
    const initialPomodoros: GuestPomodoro[] = [
      { id: '1', durationMinutes: 25, startedAt: today, completedAt: `${today}T10:00:00`, interrupted: false },
    ]
    
    const { result, rerender } = renderHook(
      ({ pomodoros }) => useStats(pomodoros, [], []),
      { initialProps: { pomodoros: initialPomodoros } }
    )
    
    expect(result.current.totalPomodoros).toBe(1)
    
    // Add another pomodoro
    const updatedPomodoros: GuestPomodoro[] = [
      ...initialPomodoros,
      { id: '2', durationMinutes: 25, startedAt: today, completedAt: `${today}T11:00:00`, interrupted: false },
    ]
    
    rerender({ pomodoros: updatedPomodoros })
    
    expect(result.current.totalPomodoros).toBe(2)
  })
  
  it('updates today stats when new pomodoro added', () => {
    const initialPomodoros: GuestPomodoro[] = []
    
    const { result, rerender } = renderHook(
      ({ pomodoros }) => useStats(pomodoros, [], []),
      { initialProps: { pomodoros: initialPomodoros } }
    )
    
    expect(result.current.today.completed).toBe(0)
    
    // Add a pomodoro for today
    const newPomodoro: GuestPomodoro = {
      id: '1',
      durationMinutes: 25,
      startedAt: today,
      completedAt: `${today}T10:00:00`,
      interrupted: false,
    }
    
    rerender({ pomodoros: [newPomodoro] })
    
    expect(result.current.today.completed).toBe(1)
    expect(result.current.today.totalMinutes).toBe(25)
  })
})
