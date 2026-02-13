/**
 * Spotify Player Component (HIDDEN - not exported in main app yet)
 * 
 * Two modes:
 * 1. Simple embed - just paste a playlist URL (no auth, 30-sec previews)
 * 2. Full integration - connect Spotify account (Premium required)
 * 
 * Enable by importing this component in TaskList or Timer area
 */

import { useState } from 'react'
import { useSpotify, extractPlaylistId, getSpotifyEmbedUrl } from '../hooks/useSpotify'

interface SpotifyPlayerProps {
  /** Whether to show full integration or just embed */
  mode?: 'embed' | 'full'
  /** For embed mode: default playlist ID */
  defaultPlaylist?: string
}

export default function SpotifyPlayer({ 
  mode = 'embed',
  defaultPlaylist = '37i9dQZF1DX5Ejj0EkURtP' // Lo-Fi Beats
}: SpotifyPlayerProps) {
  const spotify = useSpotify()
  const [playlistInput, setPlaylistInput] = useState('')
  const [playlistId, setPlaylistId] = useState(defaultPlaylist)
  const [showInput, setShowInput] = useState(false)

  const handleSetPlaylist = () => {
    const id = extractPlaylistId(playlistInput)
    if (id) {
      setPlaylistId(id)
      setPlaylistInput('')
      setShowInput(false)
    }
  }

  // Simple embed mode
  if (mode === 'embed') {
    return (
      <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white dark:text-gray-200 font-medium flex items-center gap-2">
            🎵 Focus Music
          </h3>
          <button
            onClick={() => setShowInput(!showInput)}
            className="text-sm text-white/60 hover:text-white dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showInput ? 'Cancel' : 'Change playlist'}
          </button>
        </div>

        {showInput && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={playlistInput}
              onChange={(e) => setPlaylistInput(e.target.value)}
              placeholder="Paste Spotify playlist URL..."
              className="flex-1 px-3 py-2 text-sm border border-white/20 dark:border-gray-600 bg-white/10 dark:bg-gray-700 text-white dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSetPlaylist}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              Set
            </button>
          </div>
        )}

        <div className="rounded-xl overflow-hidden">
          <iframe
            src={getSpotifyEmbedUrl(playlistId)}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>

        <p className="text-xs text-white/40 dark:text-gray-500 mt-2 text-center">
          Tip: Log into Spotify in your browser for full tracks
        </p>
      </div>
    )
  }

  // Full integration mode (Premium required)
  return (
    <div className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white dark:text-gray-200 font-medium flex items-center gap-2">
          <span className="text-green-400">●</span> Spotify
        </h3>
        {spotify.isConnected ? (
          <button
            onClick={spotify.disconnect}
            className="text-sm text-white/60 hover:text-white"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      {!spotify.isConfigured && (
        <p className="text-sm text-white/60 dark:text-gray-400 text-center py-4">
          Spotify integration not configured
        </p>
      )}

      {spotify.isConfigured && !spotify.hasToken && (
        <button
          onClick={spotify.connect}
          className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </button>
      )}

      {spotify.hasToken && (
        <div className="space-y-3">
          {spotify.currentTrack ? (
            <div className="flex items-center gap-3">
              <img
                src={spotify.currentTrack.albumArt}
                alt="Album art"
                className="w-12 h-12 rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white dark:text-gray-200 truncate font-medium">
                  {spotify.currentTrack.name}
                </p>
                <p className="text-white/60 dark:text-gray-400 text-sm truncate">
                  {spotify.currentTrack.artist}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/60 dark:text-gray-400 text-center py-2">
              No track playing
            </p>
          )}

          <div className="flex justify-center">
            <button
              onClick={spotify.togglePlayback}
              disabled={spotify.isLoading}
              className="w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            >
              {spotify.isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>

          {spotify.error && (
            <p className="text-red-400 text-sm text-center">{spotify.error}</p>
          )}
        </div>
      )}

      <p className="text-xs text-white/40 dark:text-gray-500 mt-3 text-center">
        Requires Spotify Premium
      </p>
    </div>
  )
}

/**
 * Callback handler component - mount this at /callback route
 */
export function SpotifyCallback() {
  const spotify = useSpotify()
  
  // Handle callback on mount
  useState(() => {
    spotify.handleCallback()
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white">Connecting to Spotify...</p>
      </div>
    </div>
  )
}
