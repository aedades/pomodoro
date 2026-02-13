interface DailyProgressProps {
  current: number
  goal: number | null // null means no goal set
}

export default function DailyProgress({ current, goal }: DailyProgressProps) {
  const hasGoal = goal !== null && goal > 0
  const percentage = hasGoal ? Math.min((current / goal) * 100, 100) : 0
  const isComplete = hasGoal && current >= goal

  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white dark:text-gray-200 font-medium">
          Today's Progress
        </span>
        <span className="text-white dark:text-gray-200">
          {hasGoal ? `${current} / ${goal} 🍅` : `${current} 🍅`}
        </span>
      </div>
      {hasGoal && (
        <div className="h-3 bg-white/20 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isComplete
                ? 'bg-green-400'
                : 'bg-white dark:bg-red-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isComplete && (
        <p className="text-center text-white dark:text-green-400 text-sm mt-2">
          🎉 Daily goal reached!
        </p>
      )}
    </div>
  )
}
