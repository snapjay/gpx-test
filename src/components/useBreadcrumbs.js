import { ref, onBeforeUnmount } from 'vue'
import L from 'leaflet'

const STORAGE_KEY = 'breadcrumbTrail'

export function useBreadcrumbs() {
  const tracking = ref(false)
  const trailCoords = ref([])
  const breadcrumbs = ref(null)
  let map = null
  let watchId = null

  function renderTrail() {
    if (!map) return
    if (!breadcrumbs.value) {
      breadcrumbs.value = L.polyline(trailCoords.value, { color: 'blue', weight: 4 }).addTo(map)
    } else {
      breadcrumbs.value.setLatLngs(trailCoords.value)
    }
  }

  function init(myMap) {
    map = myMap
    if (!map) return

    breadcrumbs.value = L.polyline([], { color: 'blue', weight: 4 }).addTo(map)

    const savedTrail = localStorage.getItem(STORAGE_KEY)
    if (savedTrail) {
      try {
        const coords = JSON.parse(savedTrail)
        if (Array.isArray(coords) && coords.length > 0) {
          trailCoords.value = coords
          breadcrumbs.value.setLatLngs(coords)
          map.fitBounds(breadcrumbs.value.getBounds())
        }
      } catch (err) {
        console.warn('Error parsing saved breadcrumb trail', err)
      }
    }
  }

  function startTracking() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    if (!map) return

    tracking.value = true

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const point = [lat, lon]

        trailCoords.value.push(point)
        renderTrail()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trailCoords.value))
        map.panTo(point)
      },
      (err) => console.error('Error getting position', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    )
  }

  function stopTracking() {
    tracking.value = false
    if (watchId) navigator.geolocation.clearWatch(watchId)
    watchId = null
  }

  function clearTrail() {
    trailCoords.value = []
    if (breadcrumbs.value) breadcrumbs.value.setLatLngs([])
    localStorage.removeItem(STORAGE_KEY)
  }

  function toggleTracking() {
    tracking.value ? stopTracking() : startTracking()
  }

  onBeforeUnmount(stopTracking)

  return { tracking, toggleTracking, clearTrail, init, breadcrumbs, trailCoords }
}
