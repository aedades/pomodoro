import { useState } from 'react'
import type { Settings } from '../hooks/useSettings'
import SettingsModal from './SettingsModal'

interface HeaderProps {
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
}

export default function Header({ settings, onUpdateSettings }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🍅</span>
        <h1 className="text-2xl font-bold text-white dark:text-gray-100">Pomodoro</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={() => onUpdateSettings({ dark_mode: !settings.dark_mode })}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="Toggle dark mode"
        >
          {settings.dark_mode ? '☀️' : '🌙'}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </header>
  )
}
