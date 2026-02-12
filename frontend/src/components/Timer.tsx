import type { Settings } from '../hooks/useSettings'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface TimerProps {
  mode: TimerMode
  timeLeft: number
  isRunning: boolean
  sessionCount: number
  activeTask: string | null
  onToggle: () => void
  onReset: () => void
  onModeChange: (mode: TimerMode) => void
  settings: Settings
  // Flow mode props
  isFlowMode?: boolean
  elapsed?: number
  isOverTarget?: boolean
  targetTime?: number
}

export default function Timer({
  mode,
  timeLeft,
  isRunning,
  sessionCount,
  activeTask,
  onToggle,
  onReset,
  onModeChange,
  settings,
  isFlowMode = false,
  elapsed = 0,
  isOverTarget = false,
  targetTime = 0,
}: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDuration = (m: TimerMode) => {
    switch (m) {
      case 'work':
        return settings.work_duration_minutes * 60
      case 'shortBreak':
        return settings.short_break_minutes * 60
      case 'longBreak':
        return settings.long_break_minutes * 60
    }
  }

  // Progress calculation differs for flow mode
  let progress: number
  if (isFlowMode && mode === 'work') {
    // Flow mode: progress towards target (caps at 100%)
    progress = Math.min(100, (elapsed / targetTime) * 100)
  } else {
    // Countdown mode
    progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100
  }

  const modeLabels: Record<TimerMode, string> = {
    work: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  }

  // In flow mode during work, show different button text
  const getButtonText = () => {
    if (!isRunning) return 'Start'
    if (isFlowMode && mode === 'work') {
      return isOverTarget ? 'Complete ✓' : 'Stop'
    }
    return 'Pause'
  }

  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 text-center">
      {/* Mode selector */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white dark:bg-red-500 text-red-500 dark:text-white'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {modeLabels[m]}
            {m === 'work' && settings.flow_mode_enabled && (
              <span className="ml-1 text-xs opacity-75">⏱</span>
            )}
          </button>
        ))}
      </div>

      {/* Flow mode indicator */}
      {isFlowMode && mode === 'work' && (
        <div className="mb-4 text-white/80 dark:text-gray-400 text-sm">
          <span className="bg-white/20 dark:bg-gray-700 px-3 py-1 rounded-full">
            Flow Mode — {isOverTarget ? '✓ Goal reached!' : `Goal: ${formatTime(targetTime)}`}
          </span>
        </div>
      )}

      {/* Timer display */}
      <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
            className="dark:stroke-gray-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke={isOverTarget ? '#22c55e' : 'white'} // Green when over target
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`transition-all duration-1000 ${
              isOverTarget ? 'dark:stroke-green-400' : 'dark:stroke-red-400'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl md:text-6xl font-bold tabular-nums ${
            isOverTarget 
              ? 'text-green-400' 
              : 'text-white dark:text-gray-100'
          }`}>
            {formatTime(timeLeft)}
          </span>
          {isFlowMode && mode === 'work' && isRunning && (
            <span className="text-white/60 dark:text-gray-500 text-xs mt-1">
              {isOverTarget ? 'over target' : 'counting up'}
            </span>
          )}
          {activeTask && (
            <span className="text-white/80 dark:text-gray-400 text-sm mt-2 max-w-[150px] md:max-w-[180px] truncate px-2">
              {activeTask}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 md:gap-4">
        <button
          onClick={onToggle}
          className={`px-6 md:px-8 py-3 rounded-full font-bold text-lg transition-colors ${
            isOverTarget && isRunning
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-white dark:bg-red-500 text-red-500 dark:text-white hover:bg-white/90 dark:hover:bg-red-600'
          }`}
        >
          {getButtonText()}
        </button>
        <button
          onClick={onReset}
          className="px-5 md:px-6 py-3 bg-white/20 dark:bg-gray-700 text-white rounded-full font-medium hover:bg-white/30 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Session count */}
      <div className="mt-6 flex justify-center items-center gap-2">
        {[...Array(settings.long_break_interval)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < sessionCount % settings.long_break_interval
                ? 'bg-white dark:bg-red-400'
                : 'bg-white/30 dark:bg-gray-600'
            }`}
          />
        ))}
        <span className="text-white/80 dark:text-gray-400 text-sm ml-2">
          {sessionCount} today
        </span>
      </div>
    </div>
  )
}
