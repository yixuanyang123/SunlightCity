'use client'

import { useState, useEffect } from 'react'
import { Droplets, Wind, ChevronUp, ChevronDown, Thermometer, Sun } from 'lucide-react'

interface RealTimeDataProps {
  data: {
    temperature: number
    humidity: number
    windSpeed: number
    uvIndex: number
  }
  selectedCity?: string
  error?: string | null
  /** Mobile accordion: when route panel is open, this panel is forced closed. Only set when isMobile. */
  mobileOpenPanel?: 'route' | 'env' | null
  onMobilePanelChange?: (panel: 'route' | 'env' | null) => void
}

// 城市时区映射
const CITY_TIMEZONES: { [key: string]: string } = {
  'New York': 'America/New_York',
  'Los Angeles': 'America/Los_Angeles',
  'Boston': 'America/New_York',
  'Miami': 'America/New_York',
  'San Diego': 'America/Los_Angeles',
}

export default function RealTimeData({ data, selectedCity = 'New York', error, mobileOpenPanel, onMobilePanelChange }: RealTimeDataProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      if (mobile) setIsVisible(false)
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Mobile accordion: when route panel is open, keep env panel closed
  useEffect(() => {
    if (isMobile && mobileOpenPanel === 'route') setIsVisible(false)
  }, [isMobile, mobileOpenPanel])

  useEffect(() => {
    const updateTime = () => {
      const timezone = CITY_TIMEZONES[selectedCity] || 'America/New_York'
      const now = new Date()
      
      const localTime = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
      }).format(now)
      
      setCurrentTime(localTime)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [selectedCity])

  return (
    <>
      {/* Mobile: when collapsed show small FAB (matches Route button style) */}
      {isMobile && !isVisible && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(true)
            onMobilePanelChange?.('env')
          }}
          className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-gray-900/95 backdrop-blur-sm border border-gray-600 px-3 py-2.5 shadow-lg text-yellow-400"
          aria-label="Open Environmental Factors"
        >
          <Thermometer className="h-4 w-4" />
          <span className="text-xs font-medium">{data.temperature.toFixed(0)}°C</span>
        </button>
      )}

      {(!isMobile || isVisible) && (
      <div
        className="absolute bottom-6 right-6 z-[1000] bg-gray-900/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg shadow-2xl w-80
          max-md:bottom-auto max-md:top-3 max-md:left-2 max-md:right-2 max-md:w-auto max-md:max-h-[min(60vh,calc(100%-6rem))] max-md:overflow-y-auto"
      >
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h4 className="font-semibold text-yellow-400 text-sm">Real-Time Environmental Factors</h4>
          <p className="text-xs text-gray-400 mt-1">{currentTime}</p>
        </div>
        <button
          onClick={() => {
            const next = !isVisible
            setIsVisible(next)
            if (onMobilePanelChange) onMobilePanelChange(next ? 'env' : null)
          }}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label={isVisible ? "Collapse panel" : "Expand panel"}
        >
          {isVisible ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {isVisible && (
        <>
          {error && (
            <div className="mx-4 mt-3 px-3 py-2 rounded bg-red-500/20 border border-red-500/50 text-red-300 text-xs">
              {error}. Check console for details. Ensure API allows CORS for this origin.
            </div>
          )}
          <div className="p-4 space-y-3">
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Thermometer className="w-4 h-4 text-red-400" />
            Temperature
          </div>
          <span className="text-yellow-300 font-mono font-semibold">{data.temperature.toFixed(1)}°C</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Droplets className="w-4 h-4 text-blue-400" />
            Humidity
          </div>
          <span className="text-blue-300 font-mono font-semibold">{data.humidity.toFixed(0)}%</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Wind className="w-4 h-4 text-cyan-400" />
            Wind Speed
          </div>
          <span className="text-cyan-300 font-mono font-semibold">{data.windSpeed.toFixed(1)} km/h</span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Sun className="w-4 h-4 text-yellow-400" />
            UV Index
          </div>
          <span className="text-orange-300 font-mono font-semibold">{data.uvIndex.toFixed(1)}</span>
        </div>

      </div>

      <div className="px-4 pb-4 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-500">Updates every 15 minutes</p>
      </div>
        </>
      )}
      </div>
      )}
    </>
  )
}
