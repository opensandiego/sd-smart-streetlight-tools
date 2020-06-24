mapboxgl.accessToken = 'pk.eyJ1Ijoic3dpbmdsZXkiLCJhIjoiampVaXBkYyJ9.x-w2I-NHC9yZxEH163o81g';
var map = new mapboxgl.Map({
  container: 'map', // container id
  // style: 'mapbox://styles/mapbox/streets-v11',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-117.1328, 32.7442], // starting position [lng, lat]
  zoom: 14, // starting zoom
  interactive: false // no zoom or pan
});

var boxCoordinates = document.querySelector('.box-coordinates')
var centerCoordinates = document.querySelector('.center-coordinates')
var currentTime = document.querySelector('.current-time')
var stop = document.querySelector('.stop')
map.on('load', async () => {
  const [ box, center ] = getBoundingCoordinates()
  boxCoordinates.innerHTML = box
  centerCoordinates.innerHTML = center

  const geojson = await go()
  addToMap(geojson)
})
// map.on('dragend', async e => {
//   const [ box, center ] = getBoundingCoordinates()
//   boxCoordinates.innerHTML = box
//   centerCoordinates.innerHTML = center

//   const geojson = await go()
//   map.getSource('sensors').setData(geojson)
// })
// map.on('zoomend', e => {
//   const [ box, center ] = getBoundingCoordinates()
//   boxCoordinates.innerHTML = box
//   centerCoordinates.innerHTML = center
// })

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

const go = async function() {
  // dynamically get assets...
  // const [ box ] = getBoundingCoordinates()
  // console.log('querying...', box)
  // const assets = await fetch(`/assets/?box=${box}`)
  // const json = await assets.json()
  // const onlineFeatures = json.features.filter(feature => feature.properties.status === 'ONLINE')
  // console.log('assets', json.features.length)
  // onlineFeatures.forEach(feature => {
  //   const { properties: { events } } = feature
  //   if (events && events.length > 0 && events[0].measures) {
  //     feature.properties.temp = feature.properties.events[0].measures.mean
  //     // console.log('feature temp', feature.properties.temp)
  //   }
  // })
  // json.features = onlineFeatures

  // get a static file saved on feb 28, 2020
  const assets = await fetch('/streetlights-2020-02-28-4pm.json')
  const json = await assets.json()
  // json.features.forEach(feature => {
  //   console.log(feature.properties.status)
  //   feature.properties.value = feature.properties.properties['2020-02-28--09h30m']
  // })
  logCommonPropertyNames(json)
  return json
}


const addToMap = function(geojson) {
  const colors = d3.schemeOrRd[9]
  const breaks = [60, 65, 70, 75, 80, 85, 90, 95, 100]
  let scheme = []
  breaks.forEach((value, index) => {
    scheme.push(value, colors[index])
  })
  console.log('breaks', scheme)
  console.log('colors?', colors)
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  })
  let selection
  const sensorId = 'sensors-point'
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
      'circle-radius': 14,
      // 'circle-color': 'rgb(255, 252, 217)',
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        ...scheme
        // 60,
        // '#F2F12D',
        // 65,
        // '#EED322',
        // 70,
        // '#E6B71E',
        // 75,
        // '#DA9C20',
        // 80,
        // '#CA8323',
        // 85,
        // '#B86B25',
        // 90,
        // '#A25626',
        // 95,
        // '#8B4225',
        // 100,
        // '#723122'
      ],
      'circle-color-transition': {
        'duration': 2000,
        'delay': 0
      },
      'circle-stroke-color': 'white',
      'circle-stroke-width': 1
    }
  }, 'waterway-label')

  const observations = Object.keys(geojson.features[0].properties.properties)
  let currentObservation = 0
  window.intervalHandle = setInterval(() => {
    const next = observations[currentObservation]
    currentTime.innerHTML = next
    geojson.features.forEach(feature => {
      feature.properties.value = feature.properties.properties[next]
      if (selection && feature.properties.assetUid === selection && popup) {
        popup.setHTML(popupContent(feature))
        if (!feature.properties.value) {
          console.log('next value', feature.properties.value, next)
        }
      }
    })
    currentObservation += 1
    if (currentObservation === observations.length - 1) {
      currentObservation = 0
    }
    map.getSource('sensors').setData(geojson)
  }, 200)
  stop.addEventListener('click', () => {
    clearInterval(intervalHandle)
  })

  map.on('click', e => {
    const bbox = [
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5]
    ]
    console.log(map.queryRenderedFeatures(bbox, { layers: [sensorId]}))
  })

  map.on('mouseenter', sensorId, function(e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    selection = e.features[0].properties.assetUid
    const coordinates = e.features[0].geometry.coordinates.slice()

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup
      .setLngLat(coordinates)
      .setHTML(popupContent(e.features[0]))
      .addTo(map)
  })

  map.on('mouseleave', sensorId, function() {
    map.getCanvas().style.cursor = ''
    popup.remove()
  });
}

function logCommonPropertyNames (json) {
  const { features } = json
  console.log(`Feature count: ${features.length}`)
  const online = features.filter(f => f.properties.status === 'ONLINE').length
  const offline = features.filter(f => f.properties.status === 'OFFLINE').length
  console.log(`Online: ${online}, offline: ${offline}`)

  let universal = []
  features.forEach((feature, index) => {
    const { properties } = feature.properties
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
  return (feature.properties.status === 'ONLINE' && feature.properties.value)
    ? `Temperature:  ${feature.properties.value}`
    : 'Offline'
}
