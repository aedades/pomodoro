/**
 * Spotify Web Playback SDK integration
 * 
 * SETUP REQUIRED:
 * 1. Create app at https://developer.spotify.com/dashboard
 * 2. Add redirect URIs: http://localhost:5173/callback (dev) + production URL
 * 3. Enable "Web Playback SDK" 
 * 4. Set VITE_SPOTIFY_CLIENT_ID in .env
 * 
 * LIMITATIONS:
 * - Requires Spotify Premium (free users can't use Web Playback SDK)
 * - User must authorize via OAuth flow
 * 
 * FEATURES (when enabled):
 * - Play/pause from app
 * - Auto-pause when timer stops
 * - Show "now playing" info
 */

import { useState, useCallback } from 'react'

// TODO: Move to .env when ready
// const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_ID = '' // Set this when ready
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/callback`
  : ''
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

export interface SpotifyTrack {
  name: string
  artist: string
  albumArt: string
  durationMs: number
  progressMs: number
}

export interface SpotifyState {
  isConnected: boolean
  isPlaying: boolean
  currentTrack: SpotifyTrack | null
  deviceId: string | null
}

const STORAGE_KEY = 'pomodoro:spotify:token'

/**
 * Spotify integration hook
 * 
 * Currently stubbed - enable by:
 * 1. Setting SPOTIFY_CLIENT_ID above
 * 2. Uncommenting the SDK initialization in useEffect
 */
export function useSpotify() {
  const [state, setState] = useState<SpotifyState>({
    isConnected: false,
    isPlaying: false,
    currentTrack: null,
    deviceId: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if Spotify is configured
  const isConfigured = Boolean(SPOTIFY_CLIENT_ID)

  // Get stored token
  const getToken = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      const { accessToken, expiresAt } = JSON.parse(stored)
      if (Date.now() > expiresAt) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return accessToken
    } catch {
      return null
    }
  }, [])

  // Store token
  const setToken = useCallback((accessToken: string, expiresIn: number) => {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, expiresAt }))
  }, [])

  // Initiate OAuth flow
  const connect = useCallback(() => {
    if (!isConfigured) {
      setError('Spotify not configured. Set SPOTIFY_CLIENT_ID.')
      return
    }

    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID)
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('show_dialog', 'true')

    window.location.href = authUrl.toString()
  }, [isConfigured])

  // Handle OAuth callback (call this on /callback page)
  const handleCallback = useCallback(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    
    const accessToken = params.get('access_token')
    const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
    
    if (accessToken) {
      setToken(accessToken, expiresIn)
      setState(prev => ({ ...prev, isConnected: true }))
      // Clear hash and redirect to main page
      window.location.href = '/'
    } else {
      const error = params.get('error')
      setError(error || 'Failed to connect to Spotify')
    }
  }, [setToken])

  // Disconnect
  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      isConnected: false,
      isPlaying: false,
      currentTrack: null,
      deviceId: null,
    })
  }, [])

  // Play/pause (stub)
  const togglePlayback = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError('Not connected to Spotify')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual API call
      // const endpoint = state.isPlaying ? 'pause' : 'play'
      // await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}` },
      // })
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
    } catch (e) {
      setError('Failed to control playback')
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  // Pause playback (for timer completion)
  const pause = useCallback(async () => {
    if (!state.isPlaying) return
    
    const token = getToken()
    if (!token) return

    try {
      // TODO: Implement actual API call
      // await fetch('https://api.spotify.com/v1/me/player/pause', {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}` },
      // })
      setState(prev => ({ ...prev, isPlaying: false }))
    } catch {
      // Silently fail - not critical
    }
  }, [state.isPlaying, getToken])

  // Resume playback (for timer start)
  const play = useCallback(async () => {
    if (state.isPlaying) return
    
    const token = getToken()
    if (!token) return

    try {
      // TODO: Implement actual API call
      // await fetch('https://api.spotify.com/v1/me/player/play', {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}` },
      // })
      setState(prev => ({ ...prev, isPlaying: true }))
    } catch {
      // Silently fail - not critical
    }
  }, [state.isPlaying, getToken])

  return {
    // State
    ...state,
    isLoading,
    error,
    isConfigured,
    
    // Actions
    connect,
    disconnect,
    handleCallback,
    togglePlayback,
    play,
    pause,
    
    // Utils
    hasToken: Boolean(getToken()),
  }
}

/**
 * Simple embed player (no auth required, but limited to 30-sec previews)
 * Use this for a quick "focus music" section without full integration
 */
export function getSpotifyEmbedUrl(playlistId: string): string {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
}

/**
 * Extract playlist ID from various Spotify URL formats
 * - https://open.spotify.com/playlist/37i9dQZF1DX5Ejj0EkURtP
 * - spotify:playlist:37i9dQZF1DX5Ejj0EkURtP
 */
export function extractPlaylistId(input: string): string | null {
  // Direct ID
  if (/^[a-zA-Z0-9]{22}$/.test(input)) {
    return input
  }
  
  // URL format
  const urlMatch = input.match(/playlist\/([a-zA-Z0-9]{22})/)
  if (urlMatch) return urlMatch[1]
  
  // URI format
  const uriMatch = input.match(/playlist:([a-zA-Z0-9]{22})/)
  if (uriMatch) return uriMatch[1]
  
  return null
}
