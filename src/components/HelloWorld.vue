<script setup>
import { onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import geojsonData from './output-clean1.json'
import { useBreadcrumbs } from './useBreadcrumbs.js'

const typeColors = {
  "0x1": "green",
  "0x2": "yellow",
  "0x3": "orange",
  "0x4": "red",
  "0x8": "red"
}

const mapRef = ref(null)
const { tracking, toggleTracking, clearTrail, init } = useBreadcrumbs(mapRef)

const satelliteLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { attribution: '' }
)

const streetLayer = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '' }
)

onMounted(() => {
  const map = L.map('map', {
    center: [36.15, -84.25],
    zoom: 13,
    layers: [satelliteLayer]
  })
  mapRef.value = map

  // GeoJSON layer
  const geoLayer = L.geoJSON(geojsonData, {
    style: feature => ({
      color: typeColors[feature.properties.Type] || '#ff0000',
      weight: 3
    }),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => {
        const props = feature.properties
        let popup = '<b>Trail Details:</b><br>'
        for (const key in props) popup += `${key}: ${props[key]}<br>`
        layer.bindPopup(popup).openPopup()
      })
      layer.on('mouseover', () => layer.setStyle({ weight: 5 }))
      layer.on('mouseout', () =>
        layer.setStyle({
          color: typeColors[feature.properties.Type] || '#ff0000',
          weight: 3
        })
      )
    }
  }).addTo(map)

  map.fitBounds(geoLayer.getBounds())

  // Layer switcher
  const baseLayers = {
    'Street Map': streetLayer,
    'Satellite': satelliteLayer
  }
  L.control.layers(baseLayers).addTo(map)

  // Initialize breadcrumb tracking
  init(map)
})
</script>


<template>

  <button @click="toggleTracking">
    {{ tracking ? 'Stop Tracking' : 'Start Tracking' }}
  </button>
  <button @click="clearTrail">Clear Trail</button>
  <div id="map" style="height: 1200px; width:1500px"></div>
</template>

<style scoped></style>
