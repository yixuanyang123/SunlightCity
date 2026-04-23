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
  /** Optional polyline + numbered markers for Unity coordinate testing (stable array ref). */
  unityDebugPath?: { lat: number; lng: number; label: string }[]
  /** Optional extra markers (not connected to the polyline), e.g. a separate reference lat/lon. */
  unityDebugExtraPoints?: { lat: number; lng: number; label: string }[]
  /** Second polyline + markers (e.g. another Unity test route), drawn in a distinct color. */
  unityDebugSecondaryPath?: { lat: number; lng: number; label: string }[]
  /** Third polyline + markers (another test route), e.g. Lower East. */
  unityDebugTertiaryPath?: { lat: number; lng: number; label: string }[]
  /** Fourth polyline + markers, e.g. Central Park West area. */
  unityDebugQuaternaryPath?: { lat: number; lng: number; label: string }[]
  /** Fifth polyline + markers, e.g. East Harlem. */
  unityDebugQuinaryPath?: { lat: number; lng: number; label: string }[]
  /** Sixth polyline + markers, e.g. Morningside Heights. */
  unityDebugSenaryPath?: { lat: number; lng: number; label: string }[]
  /** Seventh polyline + markers, e.g. Central Park west. */
  unityDebugSeptenaryPath?: { lat: number; lng: number; label: string }[]
  /** Eighth polyline + markers, e.g. UWS ~72nd. */
  unityDebugOctonaryPath?: { lat: number; lng: number; label: string }[]
  /** Ninth polyline + markers, e.g. UWS Columbus. */
  unityDebugNonaryPath?: { lat: number; lng: number; label: string }[]
  /** Tenth polyline + markers, e.g. Hudson Yards. */
  unityDebugDenaryPath?: { lat: number; lng: number; label: string }[]
  /** Eleventh polyline + markers (e.g. Harlem / Washington Heights). */
  unityDebug11Path?: { lat: number; lng: number; label: string }[]
  /** Twelfth polyline + markers (e.g. SoHo / Canal). */
  unityDebug12Path?: { lat: number; lng: number; label: string }[]
  /** Thirteenth polyline + markers (e.g. Gramercy / Flatiron). */
  unityDebug13Path?: { lat: number; lng: number; label: string }[]
  /** Fourteenth polyline + markers (e.g. Midtown). */
  unityDebug14Path?: { lat: number; lng: number; label: string }[]
  /** Fifteenth polyline + markers (e.g. Lower Manhattan west edge). */
  unityDebug15Path?: { lat: number; lng: number; label: string }[]
  /** Sixteenth polyline + markers (e.g. Chelsea / Hudson). */
  unityDebug16Path?: { lat: number; lng: number; label: string }[]
  /** Seventeenth polyline + markers (e.g. Inwood east ridge). */
  unityDebug17Path?: { lat: number; lng: number; label: string }[]
  /** Eighteenth polyline + markers (e.g. East Harlem central). */
  unityDebug18Path?: { lat: number; lng: number; label: string }[]
  /** Nineteenth polyline + markers (e.g. Yorkville arc). */
  unityDebug19Path?: { lat: number; lng: number; label: string }[]
  /** Twentieth polyline + markers (e.g. East Village connector). */
  unityDebug20Path?: { lat: number; lng: number; label: string }[]
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
  unityDebugPath,
  unityDebugExtraPoints,
  unityDebugSecondaryPath,
  unityDebugTertiaryPath,
  unityDebugQuaternaryPath,
  unityDebugQuinaryPath,
  unityDebugSenaryPath,
  unityDebugSeptenaryPath,
  unityDebugOctonaryPath,
  unityDebugNonaryPath,
  unityDebugDenaryPath,
  unityDebug11Path,
  unityDebug12Path,
  unityDebug13Path,
  unityDebug14Path,
  unityDebug15Path,
  unityDebug16Path,
  unityDebug17Path,
  unityDebug18Path,
  unityDebug19Path,
  unityDebug20Path,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
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
  const unityDebugGroupRef = useRef<L.LayerGroup | null>(null)


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

    // Add initial tile layer
    const tileUrl =
      mapLayer === 'standard'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

    const layer = L.tileLayer(tileUrl, { 
      attribution: '',
      keepBuffer: 2,
    })
    layer.addTo(map)
    layerRef.current = layer

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

  // Handle tile layer changes
  useEffect(() => {
    if (!mapRef.current) return

    // Remove old layer
    if (layerRef.current) {
      layerRef.current.remove()
    }

    // Add new layer
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

    //function to determine route color based on sun exposure (blue=cool, red=hot), for multi-route display
    function getRouteColor(sunExposure: number): string {
    const MIN = 30   // cool threshold
    const MAX = 85   // hot threshold

    const clamped = Math.min(Math.max(sunExposure, MIN), MAX)
    const ratio = (clamped - MIN) / (MAX - MIN)

    // Blue (240) → Red (0); green is around 120. 100% saturation so routes are vivid.
    const hue = 240 - ratio * 240
    const isGreen = hue >= 85 && hue <= 155
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

    routes.forEach((route) => {
      const latLngs = route.points.map((p) => [p.lat, p.lng] as [number, number])
      const hue = 240 - ((Math.min(Math.max(route.sunExposure, 30), 85) - 30) / 55) * 240
      const isGreen = hue >= 85 && hue <= 155
      const isSelected = selectedRouteId === route.id
      const polyline = L.polyline(latLngs, {
        color: getRouteColor(route.sunExposure),
        weight: isSelected ? 7 : isGreen ? 5.5 : 4,
        opacity: 1,
      })
      polyline.on('click', () => onRouteSelect(route.id))
      polyline.addTo(map)
      routeLayersRef.current.set(route.id, polyline)
    })

    if (optimalRouteId && routes.length > 0) {
      const optimal = routes.find((r) => r.id === optimalRouteId)
      const others = routes.filter((r) => r.id !== optimalRouteId)
      if (optimal && optimal.points.length > 0) {
        let bestIdx = Math.floor(optimal.points.length / 2)
        if (others.length > 0) {
          const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
            Math.hypot(a.lat - b.lat, a.lng - b.lng)
          const minDistToOthers = (p: { lat: number; lng: number }) => {
            let d = Infinity
            for (const route of others) {
              for (const q of route.points) {
                const t = dist(p, q)
                if (t < d) d = t
              }
            }
            return d
          }
          const step = Math.max(1, Math.floor(optimal.points.length / 20))
          let bestScore = 0
          for (let i = 0; i < optimal.points.length; i += step) {
            const score = minDistToOthers(optimal.points[i])
            if (score > bestScore) {
              bestScore = score
              bestIdx = i
            }
          }
        }
        const [lat, lng] = [optimal.points[bestIdx].lat, optimal.points[bestIdx].lng]
        const icon = L.divIcon({
          className: 'optimal-route-label',
          html: '<span style="display:inline-block;padding:2px 8px;background:#111;color:#fbbf24;font-size:11px;font-weight:700;border-radius:4px;white-space:nowrap;border:1px solid #fbbf24;">Optimal</span>',
          iconSize: [56, 28],
          iconAnchor: [28, 14],
        })
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        optimalLabelRef.current = marker
      }
    }
  }, [routes, selectedRouteId, optimalRouteId, onRouteSelect])

  // Unity test path: nodes 1→5 + polyline (same order as table); optional extra ref markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (unityDebugGroupRef.current) {
      map.removeLayer(unityDebugGroupRef.current)
      unityDebugGroupRef.current = null
    }

    const hasPath = unityDebugPath && unityDebugPath.length > 0
    const hasSecondary = unityDebugSecondaryPath && unityDebugSecondaryPath.length > 0
    const hasTertiary = unityDebugTertiaryPath && unityDebugTertiaryPath.length > 0
    const hasQuaternary = unityDebugQuaternaryPath && unityDebugQuaternaryPath.length > 0
    const hasQuinary = unityDebugQuinaryPath && unityDebugQuinaryPath.length > 0
    const hasSenary = unityDebugSenaryPath && unityDebugSenaryPath.length > 0
    const hasSeptenary = unityDebugSeptenaryPath && unityDebugSeptenaryPath.length > 0
    const hasOctonary = unityDebugOctonaryPath && unityDebugOctonaryPath.length > 0
    const hasNonary = unityDebugNonaryPath && unityDebugNonaryPath.length > 0
    const hasDenary = unityDebugDenaryPath && unityDebugDenaryPath.length > 0
    const has11 = unityDebug11Path && unityDebug11Path.length > 0
    const has12 = unityDebug12Path && unityDebug12Path.length > 0
    const has13 = unityDebug13Path && unityDebug13Path.length > 0
    const has14 = unityDebug14Path && unityDebug14Path.length > 0
    const has15 = unityDebug15Path && unityDebug15Path.length > 0
    const has16 = unityDebug16Path && unityDebug16Path.length > 0
    const has17 = unityDebug17Path && unityDebug17Path.length > 0
    const has18 = unityDebug18Path && unityDebug18Path.length > 0
    const has19 = unityDebug19Path && unityDebug19Path.length > 0
    const has20 = unityDebug20Path && unityDebug20Path.length > 0
    const extras = unityDebugExtraPoints ?? []
    if (
      !hasPath &&
      !hasSecondary &&
      !hasTertiary &&
      !hasQuaternary &&
      !hasQuinary &&
      !hasSenary &&
      !hasSeptenary &&
      !hasOctonary &&
      !hasNonary &&
      !hasDenary &&
      !has11 &&
      !has12 &&
      !has13 &&
      !has14 &&
      !has15 &&
      !has16 &&
      !has17 &&
      !has18 &&
      !has19 &&
      !has20 &&
      extras.length === 0
    )
      return

    const group = L.layerGroup()
    const boundsPoints: [number, number][] = []

    if (hasPath && unityDebugPath) {
      const latLngs = unityDebugPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs)

      const line = L.polyline(latLngs, {
        color: '#22d3ee',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line)

      unityDebugPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-node-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Unity test · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasSecondary && unityDebugSecondaryPath) {
      const latLngs2 = unityDebugSecondaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs2)

      const line2 = L.polyline(latLngs2, {
        color: '#c084fc',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line2)

      unityDebugSecondaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-wv-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#9333ea;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">West Village · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasTertiary && unityDebugTertiaryPath) {
      const latLngs3 = unityDebugTertiaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs3)

      const line3 = L.polyline(latLngs3, {
        color: '#34d399',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line3)

      unityDebugTertiaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-le-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#059669;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">UES · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasQuaternary && unityDebugQuaternaryPath) {
      const latLngs4 = unityDebugQuaternaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs4)

      const line4 = L.polyline(latLngs4, {
        color: '#f472b6',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line4)

      unityDebugQuaternaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-cpw-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#db2777;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">MS East · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasQuinary && unityDebugQuinaryPath) {
      const latLngs5 = unityDebugQuinaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs5)

      const line5 = L.polyline(latLngs5, {
        color: '#fbbf24',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line5)

      unityDebugQuinaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-eh-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#d97706;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">MS West · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (hasSenary && unityDebugSenaryPath) {
      const latLngs6 = unityDebugSenaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs6)

      const line6 = L.polyline(latLngs6, {
        color: '#60a5fa',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line6)

      unityDebugSenaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-ms-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#2563eb;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">FiDi · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasSeptenary && unityDebugSeptenaryPath) {
      const latLngs7 = unityDebugSeptenaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs7)

      const line7 = L.polyline(latLngs7, {
        color: '#f87171',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line7)

      unityDebugSeptenaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-cpwest-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#dc2626;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Central · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasOctonary && unityDebugOctonaryPath) {
      const latLngs8 = unityDebugOctonaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs8)

      const line8 = L.polyline(latLngs8, {
        color: '#8b5cf6',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line8)

      unityDebugOctonaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-uws72-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#6d28d9;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">UWS 72 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasNonary && unityDebugNonaryPath) {
      const latLngs9 = unityDebugNonaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs9)

      const line9 = L.polyline(latLngs9, {
        color: '#2dd4bf',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line9)

      unityDebugNonaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-uws-col-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#0d9488;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 9 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (hasDenary && unityDebugDenaryPath) {
      const latLngs10 = unityDebugDenaryPath.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs10)

      const line10 = L.polyline(latLngs10, {
        color: '#fb7185',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line10)

      unityDebugDenaryPath.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-hy-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#e11d48;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 10 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (has11 && unityDebug11Path) {
      const latLngs11 = unityDebug11Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs11)

      const line11 = L.polyline(latLngs11, {
        color: '#ca8a04',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line11)

      unityDebug11Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path11-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#a16207;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 11 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (has12 && unityDebug12Path) {
      const latLngs12 = unityDebug12Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs12)

      const line12 = L.polyline(latLngs12, {
        color: '#4f46e5',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line12)

      unityDebug12Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path12-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#312e81;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 12 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (has13 && unityDebug13Path) {
      const latLngs13 = unityDebug13Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs13)

      const line13 = L.polyline(latLngs13, {
        color: '#ea580c',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line13)

      unityDebug13Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path13-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#9a3412;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 13 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    if (has14 && unityDebug14Path) {
      const latLngs14 = unityDebug14Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs14)

      const line14 = L.polyline(latLngs14, {
        color: '#64748b',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line14)

      unityDebug14Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path14-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#334155;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 14 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has15 && unityDebug15Path) {
      const latLngs15 = unityDebug15Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs15)

      const line15 = L.polyline(latLngs15, {
        color: '#0891b2',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line15)

      unityDebug15Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path15-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#0e7490;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 15 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has16 && unityDebug16Path) {
      const latLngs16 = unityDebug16Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs16)

      const line16 = L.polyline(latLngs16, {
        color: '#65a30d',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line16)

      unityDebug16Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path16-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#4d7c0f;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 16 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has17 && unityDebug17Path) {
      const latLngs17 = unityDebug17Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs17)

      const line17 = L.polyline(latLngs17, {
        color: '#10b981',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line17)

      unityDebug17Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path17-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#047857;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 17 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has18 && unityDebug18Path) {
      const latLngs18 = unityDebug18Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs18)

      const line18 = L.polyline(latLngs18, {
        color: '#0ea5e9',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line18)

      unityDebug18Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path18-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#0369a1;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 18 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has19 && unityDebug19Path) {
      const latLngs19 = unityDebug19Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs19)

      const line19 = L.polyline(latLngs19, {
        color: '#be185d',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line19)

      unityDebug19Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path19-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#831843;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 19 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }


    if (has20 && unityDebug20Path) {
      const latLngs20 = unityDebug20Path.map((p) => [p.lat, p.lng] as [number, number])
      boundsPoints.push(...latLngs20)

      const line20 = L.polyline(latLngs20, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
      })
      group.addLayer(line20)

      unityDebug20Path.forEach((p) => {
        const icon = L.divIcon({
          className: 'unity-path20-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#1d4ed8;border:2px solid #fff;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        const m = L.marker([p.lat, p.lng], { icon })
        m.bindPopup(`<div class="text-xs font-semibold">Path 20 · Node ${p.label}</div>`)
        group.addLayer(m)
      })
    }

    extras.forEach((p) => {
      boundsPoints.push([p.lat, p.lng])
      const icon = L.divIcon({
        className: 'unity-extra-marker',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#f59e0b;border:2px solid #fff;color:#111;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.45);">${p.label}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      const m = L.marker([p.lat, p.lng], { icon })
      m.bindPopup(
        `<div style="font-size:12px;font-weight:600;">Ref · ${p.label}</div><div style="font-size:10px;color:#666;margin-top:4px;">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</div>`
      )
      group.addLayer(m)
    })

    group.addTo(map)
    unityDebugGroupRef.current = group

    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints)
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17 })
    }
  }, [
    unityDebugPath,
    unityDebugExtraPoints,
    unityDebugSecondaryPath,
    unityDebugTertiaryPath,
    unityDebugQuaternaryPath,
    unityDebugQuinaryPath,
    unityDebugSenaryPath,
    unityDebugSeptenaryPath,
    unityDebugOctonaryPath,
    unityDebugNonaryPath,
    unityDebugDenaryPath,
    unityDebug11Path,
    unityDebug12Path,
    unityDebug13Path,
    unityDebug14Path,
    unityDebug15Path,
    unityDebug16Path,
    unityDebug17Path,
    unityDebug18Path,
    unityDebug19Path,
    unityDebug20Path,
  ])

  


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
