'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Location, Route } from '@/lib/types'

type MapLayer = 'standard' | 'satellite'

type MockLocation = {
  name: string
  lat: number
  lng: number
  comfort: number
}

export interface LeafletMapProps {
  mapCenter: [number, number]
  mapZoom: number
  mapLayer: MapLayer
  selectionModeRef: React.MutableRefObject<'start' | 'end' | null>
  containerRef?: React.MutableRefObject<HTMLDivElement | null>
  mockLocations: MockLocation[]
  startPoint: Location | null
  endPoint: Location | null
  selectedLocation: string | null
  onLocationClick: (location: MockLocation) => void
  onSelect: (lat: number, lng: number) => void
  routes: Route[]
  selectedRouteId: string | null
  optimalRouteId: string | null
  onRouteSelect: (routeId: string) => void
  /** When true, zoom +/- control is hidden (e.g. on mobile). */
  hideZoomControl?: boolean
  /** Basemap tiles: `false` when switching layer; `true` when visible tiles finished loading. */
  onBasemapTilesReady?: (ready: boolean) => void
}

export default function LeafletMap({
  mapCenter,
  mapZoom,
  mapLayer,
  selectionModeRef,
  containerRef: containerRefProp,
  mockLocations,
  startPoint,
  endPoint,
  selectedLocation,
  onLocationClick,
  onSelect,
  routes,
  selectedRouteId,
  optimalRouteId,
  onRouteSelect,
  hideZoomControl = false,
  onBasemapTilesReady,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onBasemapTilesReadyRef = useRef(onBasemapTilesReady)
  onBasemapTilesReadyRef.current = onBasemapTilesReady
  const zoomControlRef = useRef<L.Control.Zoom | null>(null)
  const setRef = (el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (containerRefProp) containerRefProp.current = el
  }
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker | L.Marker>>(new Map())
  const routeLayersRef = useRef<Map<string, L.Polyline>>(new Map())
  const optimalLabelRef = useRef<L.Marker | null>(null)
  const routeLabelsRef = useRef<L.Marker[]>([])


  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const container = containerRef.current

    // Create map
    const map = L.map(container, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false,
    })
    mapRef.current = map

    // Tile layer is added only in the mapLayer effect so `load` and readiness stay in one place.

    // Sync map size after first layout (container may not have had final size at creation)
    const syncSize = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0 && mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }
    requestAnimationFrame(syncSize)
    setTimeout(syncSize, 50)
    setTimeout(syncSize, 200)

    // ResizeObserver: when container size changes, redraw map (only when container has valid size)
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !mapRef.current) return
      const el = containerRef.current
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        mapRef.current.invalidateSize()
      }
    })
    ro.observe(container)

    // Cleanup on unmount
    return () => {
      if (zoomControlRef.current && mapRef.current) {
        mapRef.current.removeControl(zoomControlRef.current)
        zoomControlRef.current = null
      }
      ro.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Add/remove zoom control (desktop only; hidden on mobile)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    if (hideZoomControl) {
      if (zoomControlRef.current) {
        map.removeControl(zoomControlRef.current)
        zoomControlRef.current = null
      }
    } else {
      if (!zoomControlRef.current) {
        const zoomControl = L.control.zoom({ position: 'bottomleft' })
        zoomControl.addTo(map)
        zoomControlRef.current = zoomControl
      }
    }
  }, [hideZoomControl])

  // Handle map click for point selection - read selectionModeRef so this effect never depends on selectionMode (avoids re-run → tiles stay)
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (selectionModeRef.current) {
        onSelect(e.latlng.lat, e.latlng.lng)
      }
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [onSelect, selectionModeRef])

  // // Update map view when center/zoom changes
  // useEffect(() => {
  //   if (!mapRef.current) return
  //   mapRef.current.setView(mapCenter, mapZoom, { animate: true })
  // }, [mapCenter, mapZoom])

  // Handle tile layer changes (initial basemap + standard/satellite switches)
  useEffect(() => {
    if (!mapRef.current) return

    onBasemapTilesReadyRef.current?.(false)

    if (layerRef.current) {
      layerRef.current.remove()
    }

    const tileUrl =
      mapLayer === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

    const newLayer = L.tileLayer(tileUrl, {
      attribution: '',
      keepBuffer: 2,
    })
    newLayer.addTo(mapRef.current)
    layerRef.current = newLayer

    const handleLoad = () => {
      onBasemapTilesReadyRef.current?.(true)
    }
    newLayer.once('load', handleLoad)

    return () => {
      newLayer.off('load', handleLoad)
    }
  }, [mapLayer])

  // Update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers only (never touch tile layer)
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker)
    })
    markersRef.current.clear()

    // Add custom start point marker
    if (startPoint && !mockLocations.find((loc) => loc.name === startPoint.name)) {
      const marker = L.circleMarker([startPoint.lat, startPoint.lng], {
        color: '#10B981',
        weight: 3,
        fillColor: '#10B981',
        fillOpacity: 0.9,
        radius: 11,
      })
      marker.bindPopup('<div class="text-xs font-semibold">Start Point</div>')
      marker.addTo(map)
      markersRef.current.set(`start-${startPoint.id}`, marker)
    }

    // Add custom end point marker (pin icon)
    if (endPoint && !mockLocations.find((loc) => loc.name === endPoint.name)) {
      const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
        <defs><linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b"/>
          <stop offset="100%" style="stop-color:#c92a2a"/>
        </linearGradient></defs>
        <path fill="url(#pinGrad)" stroke="#a61e1e" stroke-width="1" d="M12 0C6.5 0 2 5.4 2 12c0 9 10 24 10 24s10-15 10-24C22 5.4 17.5 0 12 0z"/>
        <circle cx="12" cy="12" r="5" fill="#fff" fill-opacity="0.9"/>
      </svg>`
      const icon = L.divIcon({
        className: 'end-pin-icon',
        html: `<div style="display:inline-block;line-height:0;">${pinSvg}</div>`,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
      })
      const marker = L.marker([endPoint.lat, endPoint.lng], { icon })
      marker.bindPopup('<div class="text-xs font-semibold">End Point</div>')
      marker.addTo(map)
      markersRef.current.set(`end-${endPoint.id}`, marker)
    }

    // Ensure tile layer is still on map and visible (re-add if needed)
    if (layerRef.current && !map.hasLayer(layerRef.current)) {
      layerRef.current.addTo(map)
    }

    // After layout updates, force Leaflet to recalc size and redraw tiles
    const container = containerRef.current
    const safeInvalidate = () => {
      if (!container || !map) return
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        map.invalidateSize()
      }
    }
    requestAnimationFrame(safeInvalidate)
    const t1 = setTimeout(safeInvalidate, 100)
    const t2 = setTimeout(safeInvalidate, 400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [mockLocations, startPoint, endPoint, selectedLocation])

    // Max Shade route = green, Shortest route = red
    function getRouteColor(sunExposure: number): string {
    const isShade = sunExposure <= 50
    const hue = isShade ? 120 : 0   // green for shade, red for shortest
    const isGreen = isShade
    const lightness = isGreen ? 32 : 52

    return `hsl(${hue}, 100%, ${lightness}%)`
  }
  
  
  // Multi-route display: clear old layers, draw routes, add "Optimal" label
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    routeLayersRef.current.forEach((polyline) => map.removeLayer(polyline))
    routeLayersRef.current.clear()

    if (optimalLabelRef.current) {
      map.removeLayer(optimalLabelRef.current)
      optimalLabelRef.current = null
    }
    routeLabelsRef.current.forEach((m) => map.removeLayer(m))
    routeLabelsRef.current = []

    routes.forEach((route) => {
      const latLngs = route.points.map((p) => [p.lat, p.lng] as [number, number])
      const isSelected = selectedRouteId === route.id

      // Visible polyline
      const polyline = L.polyline(latLngs, {
        color: getRouteColor(route.sunExposure),
        weight: isSelected ? 8 : 5,
        opacity: 1,
      })
      polyline.addTo(map)
      routeLayersRef.current.set(route.id, polyline)

      // Wide transparent hit-area polyline for easy tapping on mobile
      const hitArea = L.polyline(latLngs, {
        color: 'transparent',
        weight: 28,
        opacity: 0,
        interactive: true,
      })
      hitArea.on('click', () => onRouteSelect(route.id))
      polyline.on('click', () => onRouteSelect(route.id))
      hitArea.addTo(map)
      routeLayersRef.current.set(`${route.id}-hit`, hitArea)
    })

    // Label every route. optimalRouteId = first route (preferred per light mode).
    // With exactly 2 routes: optimal = "Shortest" or "Max Shade" depending on sort;
    // non-optimal gets the other label.
    const makeLabel = (text: string, color: string, border: string) =>
      `<span style="display:inline-block;padding:2px 8px;background:#111;color:${color};font-size:11px;font-weight:700;border-radius:4px;white-space:nowrap;border:1px solid ${border};">${text}</span>`

    const optimalRoute = routes.find((r) => r.id === optimalRouteId)
    const otherRoutes = routes.filter((r) => r.id !== optimalRouteId)

    // Determine labels: optimal has lowest sunExposure → max shade; else max sun → shortest
    const optimalLabel = optimalRoute && optimalRoute.sunExposure <= 50
      ? makeLabel('Max Shade Route', '#4ade80', '#4ade80')   // green: shadiest
      : makeLabel('Shortest Route', '#f87171', '#f87171')     // red: shortest

    const otherLabel = optimalRoute && optimalRoute.sunExposure <= 50
      ? makeLabel('Shortest Route', '#f87171', '#f87171')
      : makeLabel('Max Shade Route', '#4ade80', '#4ade80')

    const addLabelToRoute = (route: (typeof routes)[0], html: string) => {
      if (!route || route.points.length === 0) return
      // Pick midpoint farthest from the other route for readability
      const others = routes.filter((r) => r.id !== route.id)
      const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
        Math.hypot(a.lat - b.lat, a.lng - b.lng)
      let bestIdx = Math.floor(route.points.length / 2)
      if (others.length > 0) {
        const step = Math.max(1, Math.floor(route.points.length / 20))
        let bestScore = 0
        for (let i = 0; i < route.points.length; i += step) {
          let minD = Infinity
          for (const o of others) for (const q of o.points) { const d = dist(route.points[i], q); if (d < minD) minD = d }
          if (minD > bestScore) { bestScore = minD; bestIdx = i }
        }
      }
      const { lat, lng } = route.points[bestIdx]
      const icon = L.divIcon({ className: '', html, iconSize: [80, 24], iconAnchor: [40, 12] })
      const marker = L.marker([lat, lng], { icon }).addTo(map)
      routeLabelsRef.current.push(marker)
    }

    if (optimalRoute) addLabelToRoute(optimalRoute, optimalLabel)
    otherRoutes.forEach((r) => addLabelToRoute(r, otherLabel))
  }, [routes, selectedRouteId, optimalRouteId, onRouteSelect])

  


  return (
    <div
      ref={setRef}
      className="w-full h-full"
      style={{ 
        position: 'relative',
        minHeight: '100%',
        minWidth: '100%',
        backgroundColor: '#1f2937',
        zIndex: 0
      }}
    />
  )
}
