mapboxgl.accessToken = 'pk.eyJ1Ijoic3dpbmdsZXkiLCJhIjoiampVaXBkYyJ9.x-w2I-NHC9yZxEH163o81g';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  // center: [-117.1328, 32.7442],
  // zoom: 14
  center: [-117.1567, 32.7403],
  zoom: 16.54
})
let popup
let geojson
const DEFAULT_ZONE = 'SD-IE-ENVIRONMENTAL'
const sensorId = 'sensors-point'

const zoneToDefaultEventType = {
  [DEFAULT_ZONE]: 'TEMPERATURE',
  'SD-IE-TRAFFIC': 'TFEVT',
  'SD-IE-PEDESTRIAN': 'PEDEVT',
  'SD-IE-PARKING': 'PKOUT',
  'SD-IE-BICYCLE': 'BICYCLE'
}

const timezoneOffset = new Date().getTimezoneOffset()

let zone = document.querySelector('input[type="radio"]:checked').value || DEFAULT_ZONE
const zoneRadioButtons = document.querySelectorAll('input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', e => {
    if (e.target.checked) {
      zone = radio.value
      popup.remove()
      getUpdate()
    }
  })
})
const assetsButton = document.querySelector('div button#download-assets')
assetsButton.addEventListener('click', downloadAssets)
const eventsButton = document.querySelector('div button#download-events')
eventsButton.addEventListener('click', downloadEvents)
const whenStart = document.getElementById('streetlights-start')
const whenEnd = document.getElementById('streetlights-end')

map.on('load', async () => {
  geojson = await go()
  addToMap(geojson)
})
map.on('dragend', getUpdate)
map.on('zoomend', getUpdate)

function getBoundingCoordinates () {
  // example of what the city IQ app needs:
  // '32.744868:-117.148541,32.749443:-117.144088'
  // format is:  'minLatitude:minLongitude,maxLatitude:maxLongitude'
  const { _sw, _ne } = map.getBounds()
  const { lng: minLng, lat: minLat } = _sw
  const { lng: maxLng, lat: maxLat } = _ne
  const coordinates = `${minLat.toFixed(4)}:${minLng.toFixed(4)},${maxLat.toFixed(4)}:${maxLng.toFixed(4)}`

  const { lng: centerLng, lat: centerLat } = map.getCenter()
  const center = `${centerLng.toFixed(4)}, ${centerLat.toFixed(4)}`

  return [ coordinates, center ]
}

async function getUpdate () {
  geojson = await go()
  if (geojson) {
    map.getSource('sensors').setData(geojson)
  } else {
    map.getSource('sensors').setData({
      type: 'FeatureCollection',
      features: []
    })
  }
}

async function showPopup (e) {
  const bbox = [
    [e.point.x - 5, e.point.y - 5],
    [e.point.x + 5, e.point.y + 5]
  ]
  const features = map.queryRenderedFeatures(bbox, { layers: [sensorId]})
  console.log(features)
  if (features.length === 0) {
    return
  }
  popup
    .setLngLat(features[0].geometry.coordinates.slice())
    .setHTML(popupContent(features[0]))
    .addTo(map)
  const eventType = zoneToDefaultEventType[zone]
  const eventsUrl = `/events/?assetUid=${features[0].properties.assetUid}&zone=${zone}&eventType=${eventType}`
  const events = await fetch(eventsUrl)
  const json = await events.json()
  console.log('events', json)
}

const go = async function() {
  // get assets with the current map view
  const [ box ] = getBoundingCoordinates()
  try {
    const assets = await fetch(`/assets/?box=${box}&zone=${zone}`)
    const json = await assets.json()
    if (assets.ok) {
      return json
    } else {
      throw json.error
    }
  } catch (e) {
    console.log('failed to update assets, server error:', e)
    return null
  }
}


const addToMap = function(geojson) {
  popup = new mapboxgl.Popup({
    closeOnClick: false
  })
  console.log('popup', popup)
  console.log('geojson', geojson)
  map.addSource('sensors', {
    type: 'geojson',
    data: geojson
  })
  map.addLayer({
    id: sensorId,
    type: 'circle',
    source: 'sensors',
    minzoom: 7,
    paint: {
      'circle-radius': 6,
      'circle-color': [
        'match',
        ['get', 'status'],
        'ONLINE', '#5aff63',
        'OFFLINE', '#ff5a5a',
        /* other */ '#ccc'
      ],
      'circle-color-transition': {
        'duration': 2000,
        'delay': 0
      },
      'circle-stroke-color': 'white',
      'circle-stroke-width': 1
    }
  }, 'waterway-label')

  map.on('click', showPopup)
}

function logCommonPropertyNames (json) {
  const { features } = json
  console.log(`Feature count: ${features.length}`)
  const online = features.filter(f => f.properties.status === 'ONLINE').length
  const offline = features.filter(f => f.properties.status === 'OFFLINE').length
  console.log(`Online: ${online}, offline: ${offline}`)

  let universal = []
  features.forEach((feature, index) => {
    const { properties } = feature
    if (index === 0) {
      universal = Object.keys(properties)
      console.log('initial property count', universal)
    } else {
      Object.keys(properties).forEach(when => {
        if (!universal.includes(when)) {
          console.log('adding...', when)
          universal.push(when)
        }
      })
    }
  })
  console.log('final property count', universal)
}

function popupContent (feature) {
  const { status, assetUid, eventTypes } = feature.properties
  return `
    <div><strong>Status:</strong>  ${status}</div>
    <div><strong>UID:</strong>  ${assetUid}</div>
    <div><strong>Event Types:</strong>  ${eventTypes.replace(/\[|\]|\"/g, '').split(',').join(', ')}</div>
  `
}

function downloadAssets () {
  console.log('d/l assets, this?', this.classList)
  this.classList.add('is-loading')
  const csv = assetsToCsv(geojson)
  const csvName = 'sd-streetlights.csv'
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
  element.setAttribute('download', csvName)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
  this.classList.remove('is-loading')
}

function assetsToCsv (geojson) {
  const headers = Object.keys(geojson.features[0].properties)
  // assuming points for now...
  headers.push('longitude', 'latitude')
  let rows = geojson.features.map(feature => {
    let row = Object.values(feature.properties)
    row.push(feature.geometry.coordinates[0], feature.geometry.coordinates[1])
    return row
  })
  rows.unshift(headers)
  const csvText = toCsv(rows)
  return csvText
}

function eventsToCsv(json) {
  const headers = Object.keys(json[0][0])
  const rows = json.reduce((all, eventsFromOneAsset) => all.concat(eventsFromOneAsset), [])
    .map(obj => Object.values(obj))
  rows.unshift(headers)
  const csvText = toCsv(rows)
  // console.log('rows!\n', rows)
  return csvText
}

function toCsv(rows) {
  const csv = rows.map(row => {
    return row.map(cell => {
      const containsComma = typeof cell === 'string' && cell.includes(',')
      const isArray = cell && Array.isArray(cell)
      return (containsComma || isArray) ? `"${cell}"` : `${cell}`
    }).join(',')
  }).join('\n')
  return csv
}

async function downloadEvents () {
  const from = whenStart.value
  const to = whenEnd.value
  console.log('generate a download for...', from, to)
  console.log('\t...streetlight count', geojson.features.length)
  const { length } = geojson.features
  if (length > 5) {
    document.querySelector('.notification.is-warning').classList.remove('is-hidden')
    return
  } else {
    document.querySelector('.notification.is-warning').classList.add('is-hidden')
  }
  // disable the download button, show a spinner?
  // build an array of urls
  const eventType = zoneToDefaultEventType[zone]
  // TODO:  check that feature length between 1 and 5
  const urls = geojson.features.map(feature => {
    const { assetUid } = feature.properties
    const queryString = new URLSearchParams({
      assetUid,
      zone,
      eventType,
      from,
      to,
      timezoneOffset
    }).toString()
    return `/events/?${queryString}`
  })
  console.log('urls', urls)
  const responses = await Promise.all(urls.map(url => fetch(url)))
  const jsons = await Promise.all(responses.map(response => response.json()))
  const csv = eventsToCsv(jsons)

  const csvName = `sd-streetlights-${zone}-events.csv`
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
  element.setAttribute('download', csvName)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}