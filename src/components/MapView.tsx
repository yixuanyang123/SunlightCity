'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { MapPin, Navigation, Search, X, ChevronUp, ChevronDown, ChevronLeft, Clock} from 'lucide-react'
import { mockRoutePlan } from '@/lib/mockData'
import { UNITY_PATH_27, UNITY_PATH_28, UNITY_PATH_29, UNITY_PATH_30, UNITY_PATH_31 } from '@/lib/unityTestPath'
import { Location, Route } from '@/lib/types'
import dynamic from 'next/dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

// Keep dynamic + ssr:false so Leaflet (browser-only) never runs on server.
// key="main-map" keeps identity stable; loading="lazy" may reduce remount risk.
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

interface MapViewProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void
  selectedCity?: string
  setSelectedCity?: (c: string) => void
  weather?: {
    temperature: number
    humidity: number
    windSpeed: number
    uvIndex: number
  }
  onRouteRequest?: (start: Location, end: Location) => void
  /** Mobile accordion: when one panel opens, the other closes. Only set when isMobile. */
  mobileOpenPanel?: 'route' | 'env' | null
  onMobilePanelChange?: (panel: 'route' | 'env' | null) => void
}

export type MapViewHandle = {
  openMobileRouteSheet: () => void
}

const CITY_DATA: Record<
  string,
  { locations: { name: string; lat: number; lng: number; comfort: number; address?: string }[]; bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } }
> = {
  'New York': {
    locations: [],
    bbox: { minLat: 40.70, maxLat: 40.80, minLng: -74.0, maxLng: -73.95 },
  },
  'Los Angeles': {
    locations: [],
    bbox: { minLat: 33.9, maxLat: 34.3, minLng: -118.6, maxLng: -118.1 },
  },
  Boston: {
    locations: [],
    bbox: { minLat: 42.34, maxLat: 42.38, minLng: -71.14, maxLng: -71.05 },
  },
  Miami: {
    locations: [],
    bbox: { minLat: 25.72, maxLat: 25.82, minLng: -80.25, maxLng: -80.05 },
  },
  'San Diego': {
    locations: [],
    bbox: { minLat: 32.70, maxLat: 32.75, minLng: -117.20, maxLng: -117.12 },
  },
}

const toRad = (value: number) => (value * Math.PI) / 180

const getDistanceKm = (start: Location, end: Location) => {
  const R = 6371
  const dLat = toRad(end.lat - start.lat)
  const dLng = toRad(end.lng - start.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    onLocationSelect,
    selectedCity = 'New York',
    setSelectedCity,
    weather,
    onRouteRequest,
    mobileOpenPanel,
    onMobilePanelChange,
  },
  ref
) {
  const cityInfo = CITY_DATA[selectedCity] || CITY_DATA['New York']
  const mockLocations = cityInfo.locations
  const { minLat, maxLat, minLng, maxLng } = cityInfo.bbox
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [travelMode, setTravelMode] = useState<'walking' | 'cycling'>('walking')
  const [hour, setHour] = useState<number>(new Date().getHours());
  const [minute, setMinute] = useState<number>(new Date().getMinutes());

  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeSummary, setRouteSummary] = useState<{
    distance: number
    duration: number
    sunExposure: number
    color: string
  } | null>(null)

  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard')
  
  const [isMounted, setIsMounted] = useState(false)
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileRouteSheetOpen, setMobileRouteSheetOpen] = useState(false)
  /** After Find Optimal Route on mobile: sheet shows only summary until user taps back. */
  const [mobileRouteResultsView, setMobileRouteResultsView] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Mobile: detect for layout; default Route Planning collapsed only on first load when mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    if (mq.matches) setIsPanelVisible(false)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Start and end point selection
  const [startPoint, setStartPoint] = useState<Location | null>(null)
  const [endPoint, setEndPoint] = useState<Location | null>(null)
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null)
  const selectionModeRef = useRef<'start' | 'end' | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  selectionModeRef.current = selectionMode
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [coordInputError, setCoordInputError] = useState<string | null>(null)

  const [startSearchQuery, setStartSearchQuery] = useState('')
  const [endSearchQuery, setEndSearchQuery] = useState('')
  const [startSearchResults, setStartSearchResults] = useState<Location[]>([])
  const [endSearchResults, setEndSearchResults] = useState<Location[]>([])
  const [showStartResults, setShowStartResults] = useState(false)
  const [showEndResults, setShowEndResults] = useState(false)
  const [isSearchingStart, setIsSearchingStart] = useState(false)
  const [isSearchingEnd, setIsSearchingEnd] = useState(false)
  const startSearchTokenRef = useRef(0)
  const endSearchTokenRef = useRef(0)
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)
  const justClosedRef = useRef<'start' | 'end' | null>(null)
  const focusSinkRef = useRef<HTMLDivElement>(null)
  const [searchMetro, setSearchMetro] = useState(false)

  useImperativeHandle(
    ref,
    () => ({
      openMobileRouteSheet: () => {
        setMobileRouteResultsView(false)
        setMobileRouteSheetOpen(true)
        onMobilePanelChange?.('route')
      },
    }),
    [onMobilePanelChange]
  )

  useEffect(() => {
    if (!isMobile || !onMobilePanelChange) return
    if (mobileRouteSheetOpen) onMobilePanelChange('route')
    else if (!selectionMode) onMobilePanelChange(null)
  }, [isMobile, mobileRouteSheetOpen, selectionMode, onMobilePanelChange])

  useEffect(() => {
    if (isMobile && mobileOpenPanel === 'env') {
      setMobileRouteSheetOpen(false)
      setMobileRouteResultsView(false)
      setIsPanelVisible(false)
    }
  }, [isMobile, mobileOpenPanel])

  // Mobile: when user picks "set on map", close route sheet so map is fully visible
  useEffect(() => {
    if (isMobile && selectionMode) {
      setMobileRouteSheetOpen(false)
      setMobileRouteResultsView(false)
      setIsPanelVisible(false)
    }
  }, [isMobile, selectionMode])

  useEffect(() => {
    if (!routeSummary) setMobileRouteResultsView(false)
  }, [routeSummary])

  // Update cursor on map container without re-rendering LeafletMap (so tiles don't disappear)
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    if (selectionMode) el.classList.add('cursor-crosshair')
    else el.classList.remove('cursor-crosshair')
  }, [selectionMode])

  // Clear search results when entering selection mode
  useEffect(() => {
    if (selectionMode) {
      setShowStartResults(false)
      setShowEndResults(false)
    }
  }, [selectionMode])

  //Clear routes when start or end point changes
  useEffect(() => {
  setRoutes([])
  setSelectedRouteId(null)
  setRouteSummary(null)
}, [startPoint?.id, endPoint?.id])

  // Nominatim viewbox: minlon,minlat,maxlon,maxlat. When searchMetro is OFF, restrict to current city.
  const buildViewbox = () => `${minLng},${minLat},${maxLng},${maxLat}`
  const cityCenter = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }

  /** Parse "lat, lng" (WGS84). Example: 40.7484, -73.9844 */
  type LatLngParseResult =
    | { ok: true; lat: number; lng: number }
    | { ok: false; error?: string }

  const parseLatLngString = (raw: string): LatLngParseResult => {
    const trimmed = raw.trim()
    if (!trimmed.includes(',')) return { ok: false }

    const m = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (!m) {
      return {
        ok: false,
        error: 'Invalid format. Use latitude, longitude (e.g. 40.7484, -73.9844).',
      }
    }
    const lat = Number(m[1])
    const lng = Number(m[2])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, error: 'Could not parse coordinates as numbers.' }
    }
    if (lat < -90 || lat > 90) return { ok: false, error: 'Latitude must be between -90 and 90.' }
    if (lng < -180 || lng > 180) return { ok: false, error: 'Longitude must be between -180 and 180.' }
    return { ok: true, lat, lng }
  }

  const isLatLngQuery = (value: string) => parseLatLngString(value).ok
  const MIN_QUERY_LEN = 2
  const SEARCH_DEBOUNCE_MS = 200

  const fetchLandmarks = async (query: string, signal: AbortSignal) => {
    const viewbox = searchMetro ? undefined : buildViewbox()
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, viewbox }),
      signal,
    })

    if (!response.ok) {
      throw new Error('Landmark search failed')
    }

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data.map((item) => {
      const name = item?.name || (typeof item?.display_name === 'string' ? item.display_name.split(',')[0] : 'Landmark')
      const address = item?.display_name || ''

      return {
        id: String(item?.place_id ?? name),
        name,
        lat: Number(item?.lat ?? 0),
        lng: Number(item?.lon ?? 0),
        address,
      } as Location
    })
  }

  const mergePartialMatchFromCity = (query: string, apiResults: Location[]): Location[] => {
    const q = query.trim().toLowerCase()
    if (!q) return apiResults
    const fromCity = mockLocations.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q) || q.startsWith(w))
    )
    const seenIds = new Set(apiResults.map((r) => r.id))
    const seenNames = new Set(apiResults.map((r) => r.name.trim().toLowerCase()))
    const combined = [...apiResults]
    for (const m of fromCity) {
      const nameKey = m.name.trim().toLowerCase()
      if (seenIds.has(m.name) || seenNames.has(nameKey)) continue
      seenIds.add(m.name)
      seenNames.add(nameKey)
      combined.push({
        id: m.name,
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        address: m.address ?? `${m.name}, ${selectedCity}`,
      })
    }
    return combined
  }

  const sortByDistance = (list: Location[], ref: { lat: number; lng: number }) => {
    const refLoc = { ...ref, id: '', name: '' } as Location
    return [...list].sort((a, b) => getDistanceKm(refLoc, a) - getDistanceKm(refLoc, b))
  }

  // Update search results (OpenStreetMap landmarks)
  useEffect(() => {
    const query = startSearchQuery.trim()
    if (!query || query.length < MIN_QUERY_LEN || selectionMode || isLatLngQuery(query)) {
      setStartSearchResults([])
      setShowStartResults(false)
      setIsSearchingStart(false)
      return
    }
    if (startPoint && query === startPoint.name) {
      setShowStartResults(false)
      return
    }

    const controller = new AbortController()
    const token = ++startSearchTokenRef.current
    setIsSearchingStart(true)
    setShowStartResults(true)

    const timer = setTimeout(async () => {
      try {
        const apiResults = await fetchLandmarks(query, controller.signal)
        if (token !== startSearchTokenRef.current) return
        const merged = mergePartialMatchFromCity(query, apiResults)
        const ref = endPoint ?? cityCenter
        setStartSearchResults(sortByDistance(merged, ref))
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const merged = mergePartialMatchFromCity(query, [])
          const ref = endPoint ?? cityCenter
          setStartSearchResults(sortByDistance(merged, ref))
        }
      } finally {
        if (token === startSearchTokenRef.current) {
          setIsSearchingStart(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [startSearchQuery, selectedCity, selectionMode, searchMetro, endPoint, startPoint])

  useEffect(() => {
    const query = endSearchQuery.trim()
    if (!query || query.length < MIN_QUERY_LEN || selectionMode || isLatLngQuery(query)) {
      setEndSearchResults([])
      setShowEndResults(false)
      setIsSearchingEnd(false)
      return
    }
    if (endPoint && query === endPoint.name) {
      setShowEndResults(false)
      return
    }

    const controller = new AbortController()
    const token = ++endSearchTokenRef.current
    setIsSearchingEnd(true)
    setShowEndResults(true)

    const timer = setTimeout(async () => {
      try {
        const apiResults = await fetchLandmarks(query, controller.signal)
        if (token !== endSearchTokenRef.current) return
        const merged = mergePartialMatchFromCity(query, apiResults)
        const ref = startPoint ?? cityCenter
        setEndSearchResults(sortByDistance(merged, ref))
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const merged = mergePartialMatchFromCity(query, [])
          const ref = startPoint ?? cityCenter
          setEndSearchResults(sortByDistance(merged, ref))
        }
      } finally {
        if (token === endSearchTokenRef.current) {
          setIsSearchingEnd(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [endSearchQuery, selectedCity, selectionMode, searchMetro, startPoint, endPoint])

  const handleLocationClick = (location: (typeof mockLocations)[0]) => {
    setSelectedLocation(location.name)
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      name: location.name,
    })
    
    // If in selection mode, set as start or end point
    if (selectionMode === 'start') {
      const nextStart = {
        id: location.name,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
      }
      if (!validateDistance(nextStart, endPoint)) return
      setStartPoint(nextStart)
      setStartSearchQuery(location.name)
      setSelectionMode(null)
    } else if (selectionMode === 'end') {
      const nextEnd = {
        id: location.name,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
      }
      if (!validateDistance(startPoint, nextEnd)) return
      setEndPoint(nextEnd)
      setEndSearchQuery(location.name)
      setSelectionMode(null)
    }
  }

  const handleMapSelect = (lat: number, lng: number) => {
    const newLocation: Location = {
      id: `custom-${Date.now()}`,
      name: 'Custom Location',
      lat,
      lng,
    }

    if (selectionMode === 'start') {
      if (!validateDistance(newLocation, endPoint)) return
      setStartPoint(newLocation)
      setStartSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      setShowStartResults(false)
      setSelectionMode(null)
    } else if (selectionMode === 'end') {
      if (!validateDistance(startPoint, newLocation)) return
      setEndPoint(newLocation)
      setEndSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      setShowEndResults(false)
      setSelectionMode(null)
    }
  }

  const handleSearchResultClick = (location: Location, type: 'start' | 'end') => {
    focusSinkRef.current?.focus()
    justClosedRef.current = type
    setShowStartResults(false)
    setShowEndResults(false)
    if (type === 'start') {
      if (!validateDistance(location, endPoint)) return
      setStartPoint(location)
      setStartSearchQuery(location.name)
      startInputRef.current?.blur()
    } else {
      if (!validateDistance(startPoint, location)) return
      setEndPoint(location)
      setEndSearchQuery(location.name)
      endInputRef.current?.blur()
    }
    setTimeout(() => {
      justClosedRef.current = null
    }, 350)
  }

  const clearStartPoint = () => {
    setStartPoint(null)
    setStartSearchQuery('')
    setDistanceError(null)
    setCoordInputError(null)
  }

  const clearEndPoint = () => {
    setEndPoint(null)
    setEndSearchQuery('')
    setDistanceError(null)
    setCoordInputError(null)
  }

  const handleFindRoute = async () => {
    if (!validateDistance(startPoint, endPoint)) return
    if (startPoint && endPoint && onRouteRequest) {
      onRouteRequest(startPoint, endPoint)
    }
    if (!startPoint || !endPoint) return

    const departureDate = new Date()
    departureDate.setHours(hour)
    departureDate.setMinutes(minute)
    departureDate.setSeconds(0)
    const nowIso = departureDate.toISOString()

    // Save trip for Unity (origin, destination, departure). Logged in: Bearer; else anonymous_id.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sc_token')
      const anonymousId = token ? null : (() => {
        let id = localStorage.getItem('sc_anonymous_id')
        if (!id) {
          id = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
          localStorage.setItem('sc_anonymous_id', id)
        }
        return id
      })()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      fetch(`${API_BASE}/trip`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          origin: { lat: startPoint.lat, lng: startPoint.lng },
          destination: { lat: endPoint.lat, lng: endPoint.lng },
          departure: { hour, minute },
          ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        }),
      }).catch(() => {}) // fire-and-forget; do not block route loading
    }

    setRouteLoading(true)
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLat: startPoint.lat,
          startLng: startPoint.lng,
          endLat: endPoint.lat,
          endLng: endPoint.lng,
          mode: travelMode,
        }),
      })
      const data = await res.json()

      if (res.ok && data.routes?.length) {
        const sorted = [...data.routes].sort((a, b) =>
          lightMode === 'sun' ? b.sunExposure - a.sunExposure : a.sunExposure - b.sunExposure
        )
        setRoutes(sorted)
        const defaultRoute = sorted[0]
        setSelectedRouteId(defaultRoute.id)
        setRouteSummary({
          distance: defaultRoute.distance,
          duration: defaultRoute.duration,
          sunExposure: defaultRoute.sunExposure,
          color: defaultRoute.color,
        })
        if (isMobile) setMobileRouteResultsView(true)
        return
      }
    } catch (_) {
      // fallback to mock
    } finally {
      setRouteLoading(false)
    }

    const plan = mockRoutePlan(startPoint, endPoint, travelMode, nowIso, lightMode)
    setRoutes(plan.routes)
    const defaultRoute = plan.routes[0]
    setSelectedRouteId(defaultRoute.id)
    setRouteSummary({
      distance: defaultRoute.distance,
      duration: defaultRoute.duration,
      sunExposure: defaultRoute.sunExposure,
      color: defaultRoute.color,
    })
    if (isMobile) setMobileRouteResultsView(true)
  }

  const getDefaultSpeed = () => {
    const baseSpeed = travelMode === 'walking' ? 4.3 : 12
    if (!weather) return baseSpeed

    let factor = 1
    const { temperature, humidity, windSpeed, uvIndex } = weather

    if (temperature >= 30) factor -= 0.1
    if (temperature <= 5) factor -= 0.15
    if (humidity >= 80) factor -= 0.05
    if (uvIndex >= 8) factor -= 0.05
    if (windSpeed >= 29) factor -= travelMode === 'cycling' ? 0.12 : 0.06

    const adjusted = baseSpeed * Math.max(0.7, factor)
    return Math.round(adjusted * 10) / 10
  }

  const getSeason = (date: Date): 'Winter' | 'Spring' | 'Summer' | 'Autumn' => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';   // March - May
  if (month >= 5 && month <= 7) return 'Summer';   // June - Aug
  if (month >= 8 && month <= 10) return 'Autumn';  // Sept - Nov
  return 'Winter';                                 // Dec - Feb
  };

const getLightDefault = (): 'sun' | 'shade' => 'shade'

  const setStartTimeToNow = () => {
    const now = new Date()
    let currentHours = now.getHours();
    let currentMinutes = now.getMinutes()

    setHour(currentHours)
    setMinute(currentMinutes)
  }

  const handleRouteSelect = (routeId: string) => {
  setSelectedRouteId(routeId)

  const selected = routes.find(r => r.id === routeId)
  if (!selected) return

  setRouteSummary({
    distance: selected.distance,
    duration: selected.duration,
    sunExposure: selected.sunExposure,
    color: selected.color,
  })
  }

  // Fetch algorithm optimal route from backend and display on map
  const handleLoadAlgorithmRoute = async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('sc_token')
    if (!token) {
      let anon = localStorage.getItem('sc_anonymous_id')
      if (!anon) {
        anon = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
        localStorage.setItem('sc_anonymous_id', anon)
      }
    }
    const params = new URLSearchParams()
    if (!token) {
      const anon = localStorage.getItem('sc_anonymous_id')
      if (anon) params.set('anonymous_id', anon)
    }
    const url = `${API_BASE}/optimal-route${params.toString() ? `?${params.toString()}` : ''}`
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    try {
      const res = await fetch(url, { headers })
      if (res.status === 404) {
        setRoutes([])
        setSelectedRouteId(null)
        setRouteSummary(null)
        return
      }
      if (!res.ok) throw new Error(await res.text() || res.statusText)
      const data = await res.json()
      const points: { lat: number; lng: number }[] = [
        { lat: data.origin.lat, lng: data.origin.lng },
        ...(data.waypoints || []).map((p: { lat: number; lng: number }) => ({ lat: p.lat, lng: p.lng })),
        { lat: data.destination.lat, lng: data.destination.lng },
      ]
      const algorithmRoute: Route = {
        id: 'algorithm-route',
        points,
        distance: data.total_distance_km ?? 0,
        sunExposure: 50,
        duration: data.total_time_minutes ?? 0,
        color: '#22c55e',
      }
      setRoutes([algorithmRoute])
      setSelectedRouteId(algorithmRoute.id)
      setRouteSummary({
        distance: algorithmRoute.distance,
        duration: algorithmRoute.duration,
        sunExposure: algorithmRoute.sunExposure,
        color: algorithmRoute.color,
      })
    } catch (_) {
      setRoutes([])
      setSelectedRouteId(null)
      setRouteSummary(null)
    }
  }

  const validateDistance = (start: Location | null, end: Location | null) => {
    if (!start || !end) {
      setDistanceError(null)
      return true
    }

    const distance = getDistanceKm(start, end)
    if (distance > 15) {
      setDistanceError(`Route distance ${distance.toFixed(1)} km exceeds 15 km limit for walking/cycling.`)
      return false
    }

    setDistanceError(null)
    return true
  }

  const applyLatLngFromInput = (which: 'start' | 'end') => {
    const raw = which === 'start' ? startSearchQuery : endSearchQuery
    const trimmed = raw.trim()
    if (!trimmed.includes(',')) {
      setCoordInputError(null)
      return
    }
    const result = parseLatLngString(trimmed)
    if (result.ok) {
      setCoordInputError(null)
      const loc: Location = {
        id: `coord-${Date.now()}`,
        name: `${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`,
        lat: result.lat,
        lng: result.lng,
      }
      if (which === 'start') {
        if (!validateDistance(loc, endPoint)) return
        setStartPoint(loc)
        setStartSearchQuery(loc.name)
        setShowStartResults(false)
        startInputRef.current?.blur()
      } else {
        if (!validateDistance(startPoint, loc)) return
        setEndPoint(loc)
        setEndSearchQuery(loc.name)
        setShowEndResults(false)
        endInputRef.current?.blur()
      }
      return
    }
    if (result.error) setCoordInputError(result.error)
    else setCoordInputError(null)
  }

  const [lightMode, setLightMode] = useState<'sun' | 'shade'>(getLightDefault())
  const defaultSpeed = getDefaultSpeed()

  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2
  const mapCenter: [number, number] = [centerLat, centerLng]
  const mapZoom = 12

  const renderRouteForm = (showCityLayer: boolean, mobileSummaryOnly = false) => {
    if (mobileSummaryOnly) {
      if (!routeSummary) {
        return (
          <div className="flex items-center justify-center p-6 text-sm text-gray-400">Loading route…</div>
        )
      }
      return (
        <div className="p-3 pb-4">
          <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-gray-300">
            <div className="flex items-center justify-between py-1">
              <span>Distance</span>
              <span className="font-mono text-white">{routeSummary.distance} km</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Duration</span>
              <span className="font-mono text-white">{routeSummary.duration} min</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Sun Exposure</span>
              <span className="font-mono text-white">{routeSummary.sunExposure}%</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Mode Speed</span>
              <span className="font-mono text-white">{defaultSpeed} km/h</span>
            </div>
            <div className="mt-2 space-y-1.5 border-t border-gray-700 pt-2">
              <div className="text-center text-[10px] text-gray-400">Sun Exposure Scale</div>
              <div
                className="h-2 w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, hsl(240,100%,50%), hsl(120,100%,50%), hsl(60,100%,50%), hsl(0,100%,50%))',
                }}
              />
              <div className="flex justify-between text-[9px] text-gray-500">
                <span>&lt; 30% Cool</span>
                <span>~60%</span>
                <span>&gt; 85% Hot</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
          <div
            className={
              showCityLayer
                ? 'flex flex-col gap-2 p-2'
                : 'flex flex-col gap-3 p-3'
            }
          >
            {(distanceError || coordInputError) && (
              <div className="rounded border border-red-500/50 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-200">
                {distanceError || coordInputError}
              </div>
            )}

            {/* Mobile: City + Base Map inside sheet so map stays clear when closed */}
            {showCityLayer && (
              <div className="order-1 space-y-1.5 border-b border-gray-700 pb-1.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
                    className="w-full rounded bg-gray-800 border border-gray-600 text-xs text-gray-200 px-2 py-1.5 outline-none"
                  >
                    {Object.keys(CITY_DATA).map((c) => (
                      <option key={c} value={c} className="text-black">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Base Map</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMapLayer('standard')}
                      className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                        mapLayer === 'standard'
                          ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapLayer('satellite')}
                      className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                        mapLayer === 'satellite'
                          ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                          : 'bg-gray-800 text-gray-300 border-gray-700'
                      }`}
                    >
                      Satellite
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              className={
                showCityLayer
                  ? 'order-3 flex flex-col gap-2'
                  : 'flex flex-col gap-3'
              }
            >
            {/* Travel Mode Toggle */}
            <div>
              <label
                className={`text-xs text-gray-300 flex items-center gap-2 ${showCityLayer ? 'mb-0.5' : 'mb-1.5'}`}
              >
                Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTravelMode('walking')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    travelMode === 'walking'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Walking
                </button>
                <button
                  onClick={() => setTravelMode('cycling')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    travelMode === 'cycling'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Cycling
                </button>
              </div>
              <div className={`text-[10px] text-gray-400 ${showCityLayer ? 'mt-0.5' : 'mt-1'}`}>
                Default speed: {defaultSpeed} km/h (weather-adjusted)
              </div>
            </div>

            {/* Light/Shade Mode Toggle */}
            <div>
              <label
                className={`text-xs text-gray-300 flex items-center gap-2 ${showCityLayer ? 'mb-0.5' : 'mb-1.5'}`}
              >
                Light preference
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLightMode('sun')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    lightMode === 'sun'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Prefer Sunlight
                </button>
                <button
                  onClick={() => setLightMode('shade')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs transition-all ${
                    lightMode === 'shade'
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Prefer Shade
                </button>
              </div>
              <div className={`text-[10px] text-gray-400 ${showCityLayer ? 'mt-0.5' : 'mt-1'}`}>
                Default is shade
              </div>
            </div>

          {/* Start Time Selection */}
          <div>
            <label
              className={`text-xs text-gray-300 flex items-center gap-2 ${showCityLayer ? 'mb-0.5' : 'mb-1.5'}`}
            >
              <Clock className="w-3 h-3" /> Departure Time
            </label>
            <div className="flex items-center gap-2 ">
              <select value = {hour} onChange={(e) => setHour(parseInt(e.target.value))} className="flex-1 bg-gray-800 text-white text-xs p-1 rounded"> 
                {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                  ))}
              </select>
              <span className="text-gray-400">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => {
                  const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  if (!Number.isNaN(v)) setMinute(Math.min(59, Math.max(0, v)))
                }}
                className="flex-1 w-12 bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
              <button onClick={setStartTimeToNow} className="ml-2 px-2 py-1.5 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-all">Set to Current Time</button>
              </div>

          </div>

        {showCityLayer && startPoint && endPoint && (
          <button
            type="button"
            onClick={handleFindRoute}
            disabled={routeLoading}
            className="mt-0.5 w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold rounded text-sm transition-all"
          >
            {routeLoading ? 'Loading routes…' : 'Find Optimal Route'}
          </button>
        )}
            </div>

          <div
            className={
              showCityLayer
                ? 'order-2 flex flex-col gap-2'
                : 'flex flex-col gap-3'
            }
          >
          {/* Start Point Selection */}
          <div className="min-w-0">
            <label
              className={`text-xs text-gray-300 flex items-center gap-2 ${showCityLayer ? 'mb-0.5' : 'mb-1.5'}`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Start Point
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={startInputRef}
                    type="text"
                    value={startSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value
                      setCoordInputError(null)
                      setStartSearchQuery(v)
                      if (v.trim().length >= MIN_QUERY_LEN) setShowStartResults(true)
                      else setShowStartResults(false)
                    }}
                    onBlur={() => applyLatLngFromInput('start')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyLatLngFromInput('start')
                      }
                    }}
                    placeholder="40.7484, -73.9844 or search…"
                    className="w-full pl-9 pr-9 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-green-500"
                  />
                  {startPoint && (
                    <button
                      onClick={clearStartPoint}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectionMode(selectionMode === 'start' ? null : 'start')}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    selectionMode === 'start'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {showStartResults && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                  {isSearchingStart && (
                    <div className="px-2 py-2 text-[11px] text-gray-400">Searching...</div>
                  )}
                  {!isSearchingStart && startSearchResults.length === 0 && (
                    <div className="px-2 py-2 text-[11px] text-gray-400">No results found</div>
                  )}
                  {!isSearchingStart && startSearchResults.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSearchResultClick(location, 'start')}
                      className="w-full text-left px-2 py-1.5 hover:bg-gray-700 text-white text-xs border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-[10px] text-gray-400 truncate">{location.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={focusSinkRef} tabIndex={-1} className="sr-only" aria-hidden />

          {/* End Point Selection */}
          <div className="min-w-0">
            <label
              className={`text-xs text-gray-300 flex items-center gap-2 ${showCityLayer ? 'mb-0.5' : 'mb-1.5'}`}
            >
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              {showCityLayer ? 'Destination' : 'End Point'}
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={endInputRef}
                    type="text"
                    value={endSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value
                      setCoordInputError(null)
                      setEndSearchQuery(v)
                      if (v.trim().length >= MIN_QUERY_LEN) setShowEndResults(true)
                      else setShowEndResults(false)
                    }}
                    onBlur={() => applyLatLngFromInput('end')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyLatLngFromInput('end')
                      }
                    }}
                    placeholder={
                      showCityLayer ? '40.7484, -73.9844 or destination…' : '40.7484, -73.9844 or search…'
                    }
                    className="w-full pl-9 pr-9 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  {endPoint && (
                    <button
                      onClick={clearEndPoint}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectionMode(selectionMode === 'end' ? null : 'end')}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    selectionMode === 'end'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {showEndResults && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                  {isSearchingEnd && (
                    <div className="px-2 py-2 text-[11px] text-gray-400">Searching...</div>
                  )}
                  {!isSearchingEnd && endSearchResults.length === 0 && (
                    <div className="px-2 py-2 text-[11px] text-gray-400">No results found</div>
                  )}
                  {!isSearchingEnd && endSearchResults.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSearchResultClick(location, 'end')}
                      className="w-full text-left px-2 py-1.5 hover:bg-gray-700 text-white text-xs border-b border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium">{location.name}</div>
                      {location.address && (
                        <div className="text-[10px] text-gray-400 truncate">{location.address}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

        {!showCityLayer && startPoint && endPoint && (
          <button
            type="button"
            onClick={handleFindRoute}
            disabled={routeLoading}
            className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold rounded text-xs transition-all"
          >
            {routeLoading ? 'Loading routes…' : 'Find Optimal Route'}
          </button>
        )}

        {/* Route Summary */}
        {routeSummary && (
          <div
            className={`rounded border border-gray-700 bg-gray-800/60 px-2 py-1.5 text-xs ${showCityLayer ? 'mt-1.5' : ''}`}
          >
            <div className="flex items-center justify-between text-gray-300">
              <span>Distance</span>
              <span className="font-mono">{routeSummary.distance} km</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Duration</span>
              <span className="font-mono">{routeSummary.duration} min</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Sun Exposure</span>
              <span className="font-mono">{routeSummary.sunExposure}%</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Mode Speed</span>
              <span className="font-mono">{defaultSpeed} km/h</span>
            </div>
          <div className="pt-2 border-t border-gray-700 space-y-1">
      <div className="text-[10px] text-gray-400 text-center">
        Sun Exposure Scale
      </div>

      {/* Gradient Bar Legend*/}
      <div
        className="h-2 w-full rounded-full"
        style={{
          background:
            'linear-gradient(to right, hsl(240,100%,50%), hsl(120,100%,50%), hsl(60,100%,50%), hsl(0,100%,50%))',
        }}
      />

      {/* Scale Labels */}
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>&lt; 30% Cool</span>
        <span>~60%</span>
        <span>&gt; 85% Hot</span>
      </div>
    </div>

          </div>
        )}
          </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-dark overflow-hidden">
      {/* Map Background with Grid */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-10" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mobile: minimal bar when selecting point on map (map stays full visible) */}
      {isMobile && selectionMode && (
        <div className="fixed bottom-24 left-3 right-3 z-[10] flex items-center justify-between gap-2 rounded-xl bg-gray-900/95 backdrop-blur-sm border border-yellow-500/40 px-4 py-3 shadow-lg">
          <span className="text-sm text-yellow-300 font-medium">
            Tap map to set {selectionMode === 'start' ? 'start' : 'end'} point
          </span>
          <button
            type="button"
            onClick={() => setSelectionMode(null)}
            className="flex-shrink-0 rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Route Selection Panel — desktop only */}
      {!isMobile && (
      <div
        className="absolute z-[5] top-4 left-4 right-auto bottom-auto max-h-[min(85vh,880px)] max-w-md overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/95 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900/95 p-3 sticky top-0 z-[6]">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-yellow-400" />
            <h3 className="text-yellow-400 font-semibold text-sm">Route Planning</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsPanelVisible((v) => !v)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label={isPanelVisible ? "Collapse panel" : "Expand panel"}
          >
            {isPanelVisible ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        {isPanelVisible && renderRouteForm(false)}
      </div>
      )}

      {isMobile && mobileRouteSheetOpen && (
        <>
          {/* Above BottomNav (z-2000); dim includes nav so sheet feels modal */}
          <button
            type="button"
            aria-label="Close directions"
            className="fixed inset-0 z-[2090] bg-black/50 md:hidden"
            onClick={() => {
              setMobileRouteSheetOpen(false)
              setMobileRouteResultsView(false)
              onMobilePanelChange?.(null)
            }}
          />
          {/* Same bottom offset as Dashboard pb-[5.75rem] — panel never overlaps Map/Shade/3D/Analysis + footer */}
          <div className="fixed bottom-[5.75rem] left-0 right-0 z-[2100] flex max-h-[min(92vh,calc(100dvh-5.75rem-0.5rem))] flex-col rounded-t-2xl border border-gray-700 bg-gray-900 shadow-2xl md:hidden pb-[max(8px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => {
                setMobileRouteSheetOpen(false)
                setMobileRouteResultsView(false)
                onMobilePanelChange?.(null)
              }}
              className="flex w-full shrink-0 flex-col items-center pt-3 pb-1 active:bg-gray-800/50"
              aria-label="Close directions"
            >
              <span className="h-1 w-10 rounded-full bg-gray-500" />
            </button>
            <div className="flex shrink-0 items-center border-b border-gray-700 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {mobileRouteResultsView && (
                  <button
                    type="button"
                    onClick={() => setMobileRouteResultsView(false)}
                    className="shrink-0 rounded-lg p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
                    aria-label="Edit route"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <Navigation className="h-5 w-5 shrink-0 text-yellow-400" />
                <span className="truncate text-base font-semibold text-yellow-400">
                  {mobileRouteResultsView ? 'Route' : 'Directions'}
                </span>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {renderRouteForm(true, mobileRouteResultsView)}
            </div>
          </div>
        </>
      )}

      {/* City + Layer Selector - Top Right (desktop only; on mobile moved into route sheet) */}
      <div className="hidden md:block absolute top-4 right-4 z-[5] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl px-3 py-2 w-48 space-y-2">
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">City</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity && setSelectedCity(e.target.value)}
            className="bg-transparent text-xs text-gray-200 outline-none w-full"
          >
            {Object.keys(CITY_DATA).map((c) => (
              <option key={c} value={c} className="text-black">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 mb-1">Base Map</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMapLayer('standard')}
              className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                mapLayer === 'standard'
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-1.5 rounded text-[11px] transition-all border ${
                mapLayer === 'satellite'
                  ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full flex flex-col min-h-0">
        {/* Map Container - min-h-0 lets flex shrink; min height keeps map visible after layout changes */}
        <div
          className="flex-1 relative min-h-0 p-0 md:p-3"
          style={{ minHeight: 300 }}
        >
          {/* Hint as sibling of map container so we never add/remove nodes inside map container (prevents map unmount) */}
          {selectionMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10] px-4 py-2.5 bg-gray-900 border-2 border-yellow-400 rounded-lg shadow-lg text-yellow-300 text-sm font-semibold whitespace-nowrap pointer-events-none">
              Click anywhere on map to set {selectionMode} point
            </div>
          )}
          <div
            key="map-container"
            className="w-full h-full relative overflow-hidden rounded-none border-0 md:rounded-xl md:border-2 md:border-yellow-500/30"
            style={{ backgroundColor: '#1a1a1a', minHeight: 280 }}
          >
            {isMounted && (
              <LeafletMap
                key="main-map"
                containerRef={mapContainerRef}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                mapLayer={mapLayer}
                selectionModeRef={selectionModeRef}
                mockLocations={mockLocations}
                startPoint={startPoint}
                endPoint={endPoint}
                selectedLocation={selectedLocation}
                onLocationClick={handleLocationClick}
                onSelect={handleMapSelect}
                routes={routes}
                selectedRouteId={selectedRouteId}
                optimalRouteId={routes[0]?.id ?? null}
                onRouteSelect={handleRouteSelect}
                hideZoomControl={isMobile}
                unityDebugPath={UNITY_PATH_27}
                unityDebugPath2={UNITY_PATH_28}
                unityDebugPath3={UNITY_PATH_29}
                unityDebugPath4={UNITY_PATH_30}
                unityDebugPath5={UNITY_PATH_31}
              />
            )}


          </div>
        </div>

        {/* Controls Bar — desktop only; mobile copyright lives under BottomNav */}
        <div className="hidden md:flex px-3 py-1.5 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 items-center justify-center">
          <p className="text-gray-400 text-xs">© Cornell University AEXUS</p>
        </div>
      </div>
    </div>
  )
})

export default MapView
