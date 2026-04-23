'use client'

import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MapView, { type MapViewHandle } from './MapView'
import ShadeMapView from './ShadeMapView'
import DataPanel from './DataPanel'
import RealTimeData from './RealTimeData'
import { CITY_COORDS } from '@/lib/cityData'
import type { TabId } from './Sidebar'

export type MobileOpenPanel = 'route' | 'env' | null

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('map')
  const [mobileOpenPanel, setMobileOpenPanel] = useState<MobileOpenPanel>(null)
  const [isMobile, setIsMobile] = useState(false)
  const mapViewRef = useRef<MapViewHandle>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('New York')
  const [weather, setWeather] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    uvIndex: 0,
  })
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [mobileRouteLoading, setMobileRouteLoading] = useState(false)

  useEffect(() => {
    const coords = CITY_COORDS[selectedCity] || CITY_COORDS['New York']
    const controller = new AbortController()
    const apiUrl = '/api/weather'

    const loadWeather = async () => {
      setWeatherError(null)
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: coords.lat, lon: coords.lng }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`)
        }

        const raw = await response.json()
        const data = raw?.body && typeof raw.body === 'string' ? JSON.parse(raw.body) : raw
        const current = data?.current || {}

        const temp = current.temperature_2m ?? 0
        const humidityVal = current.relative_humidity_2m ?? 0
        const uvVal = current.uv_index ?? 0
        const windVal = current.wind_speed_10m ?? 0

        setWeather({
          temperature: Number(temp),
          humidity: Number(humidityVal),
          windSpeed: Number(windVal),
          uvIndex: Number(uvVal),
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Failed to load weather'
          setWeatherError(msg)
          if (process.env.NODE_ENV === 'development') {
            console.error('[Weather API]', msg, err)
          }
        }
      }
    }

    loadWeather()
    const interval = setInterval(loadWeather, 15 * 60 * 1000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [selectedCity])

  useEffect(() => {
    if (activeTab !== 'map') setMobileRouteLoading(false)
  }, [activeTab])

  return (
    <>
      {/* Main column: keep overflow-hidden here so Leaflet/map clips inside; do not wrap BottomNav or fixed nav can be clipped on mobile WebKit */}
      <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-secondary to-dark md:h-screen">
        {/* Header */}
        <Header />

        {/* Mobile search bar — map tab only */}
        {activeTab === 'map' && (
          <div className="relative z-[15] md:hidden px-4 pt-2 pb-1 bg-gradient-to-b from-dark via-dark to-gray-900">
            <button
              type="button"
              onClick={() => {
                setActiveTab('map')
                mapViewRef.current?.openMobileRouteSheet()
              }}
              className="w-full flex items-center gap-2 rounded-full bg-white shadow-lg px-4 py-2.5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <span className="text-sm">🔍</span>
              </div>
              <span className="flex-1 text-left text-sm text-gray-500 truncate">
                Choose your route
              </span>
            </button>
            {/* Overlay only: does not consume vertical space or push the map */}
            {mobileRouteLoading && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none fixed left-1/2 top-[10.9rem] z-30 max-w-[min(92vw,20rem)] -translate-x-1/2"
              >
                <div className="rounded-full border border-yellow-500/60 bg-gray-950/95 px-5 py-2 text-center text-sm font-semibold text-yellow-400 shadow-lg shadow-black/40 backdrop-blur-sm">
                  Routes are loading
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar - desktop only */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Map/Content Area — only Analysis scroll needs bottom inset for fixed nav; map/shade/3d fill to bottom (nav overlays) */}
          <div
            className={`flex-1 relative min-h-0 ${
              activeTab === 'analysis' ? 'pb-[5.75rem] md:pb-0' : ''
            }`}
          >
            {activeTab === 'map' && (
              <MapView
                ref={mapViewRef}
                onLocationSelect={setSelectedLocation}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                weather={weather}
                mobileOpenPanel={isMobile ? mobileOpenPanel : undefined}
                onMobilePanelChange={isMobile ? setMobileOpenPanel : undefined}
                onMobileRouteLoadingChange={setMobileRouteLoading}
              />
            )}
            {activeTab === 'shade' && <ShadeMapView />}
            {activeTab === '3d' && (
              <div className="w-full h-full bg-dark flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-2xl font-bold mb-4">3D Urban Model</p>
                  <p className="text-gray-500">Three.js 3D visualization coming soon...</p>
                </div>
              </div>
            )}
            {activeTab === 'analysis' && (
              <div className="h-full min-h-0 w-full overflow-y-auto overscroll-y-contain bg-dark p-6">
                <DataPanel
                  location={selectedLocation}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                />
              </div>
            )}

            {/* Real-time Data Panel - Only show on map and 3d */}
            {(activeTab === 'map' || activeTab === '3d') && (
              <RealTimeData
                data={weather}
                selectedCity={selectedCity}
                error={weatherError}
                mobileOpenPanel={isMobile ? mobileOpenPanel : undefined}
                onMobilePanelChange={isMobile ? setMobileOpenPanel : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav — sibling of overflow-hidden root so position:fixed is not clipped (Shade Leaflet + WebKit) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  )
}
