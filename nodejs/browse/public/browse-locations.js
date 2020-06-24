mapboxgl.accessToken = 'pk.eyJ1Ijoic3dpbmdsZXkiLCJhIjoiampVaXBkYyJ9.x-w2I-NHC9yZxEH163o81g';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-117.1328, 32.7442],
  zoom: 14
})
let popup
const DEFAULT_LOCATION_TYPE = 'PARKING_ZONE'
const locations = 'locations'
const locationsId= `${locations}-layer`

let boxCoordinates = document.querySelector('.box-coordinates')
let centerCoordinates = document.querySelector('.center-coordinates')

let locationType = document.querySelector('input[type="radio"]:checked').value || DEFAULT_LOCATION_TYPE
let zoneRadioButtons = document.querySelectorAll('input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', e => {
    if (e.target.checked) {
      locationType = radio.value
      popup.remove()
      getUpdate()
    }
  })
})

map.on('load', async () => {
  const [ box, center ] = getBoundingCoordinates()
  boxCoordinates.innerHTML = box
  centerCoordinates.innerHTML = center

  const geojson = await go()
  addToMap(geojson)
})
map.on('dragend', e => {
  const [ box, center ] = getBoundingCoordinates()
  boxCoordinates.innerHTML = box
  centerCoordinates.innerHTML = center
  getUpdate()
})
map.on('zoomend', e => {
  const [ box, center ] = getBoundingCoordinates()
  boxCoordinates.innerHTML = box
  centerCoordinates.innerHTML = center
  getUpdate()
})

function getBoundingCoordinates () {
  // example of what the city IQ api needs:
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
  const geojson = await go()
  map.getSource(locations).setData(geojson)
}

function showPopup (e) {
  const bbox = [
    [e.point.x - 5, e.point.y - 5],
    [e.point.x + 5, e.point.y + 5]
  ]
  const features = map.queryRenderedFeatures(bbox, { layers: [locationsId]})
  console.log(features)
  if (features.length === 0) {
    return
  }
  popup
    .setLngLat(e.lngLat)
    .setHTML(popupContent(features[0]))
    .addTo(map)
}

const go = async function() {
  // dynamically get assets...
  const [ box ] = getBoundingCoordinates()
  const locations = await fetch(`/locations/?box=${box}&locationType=${locationType}`)
  const json = await locations.json()
  console.log('locations json', json)
  return json
}


const addToMap = function(geojson) {
  popup = new mapboxgl.Popup({
    closeOnClick: false
  })
  console.log('geojson', geojson)
  map.addSource(locations, {
    type: 'geojson',
    data: geojson
  })
  map.addLayer({
    id: locationsId,
    type: 'line',
    source: locations,
    minzoom: 7,
    paint: {
      'line-color': '#d9ffdb',
      'line-opacity': 0.8
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
  const { locationUid, locationType } = feature.properties
  return `
    <div><strong>Location Info</strong></div>
    <div><strong>UID:</strong>  ${locationUid}</div>
    <div><strong>Types:</strong>  ${locationType}</div>
  `
}
