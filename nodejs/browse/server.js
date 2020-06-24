const path = require('path')
const express = require('express')
const cors = require('cors')
const app = express()
const favicon = require('serve-favicon')
const tokenMiddleware = require('./city-iq-token-middleware')

const {
  getAssets,
  getEvents,
  getLocations
} = require('../streetlights')

const zoneToDefaultEventType = {
  'SD-IE-ENVIRONMENTAL': 'TEMPERATURE',
  'SD-IE-TRAFFIC': 'TFEVT',
  'SD-IE-PEDESTRIAN': 'PEDEVT',
  'SD-IE-PARKING': 'PKIN',
  'SD-IE-BICYCLE': 'BICYCLE'
}

const locationTypeToZone = {
  'PARKING_ZONE': 'SD-IE-PARKING',
  'TRAFFIC_LANE': 'SD-IE-TRAFFIC',
  'WALKWAY': 'SD-IE-PEDESTRIAN'
}

app.use(favicon(path.join(__dirname, 'public', 'favicon.svg')))
app.use(express.static('public'))

app.get('/temperatures', function (request, response) {
  response.sendFile(`${__dirname}/views/temperatures.html`)
})
app.get('/temperatures/:file', function (request, response) {
  response.sendFile(`${__dirname}/public/${request.params.file}`)
})

app.get('/browse-assets', function (request, response) {
  response.sendFile(`${__dirname}/views/browse-assets.html`)
})
app.get('/browse-assets/:file', function (request, response) {
  response.sendFile(`${__dirname}/public/${request.params.file}`)
})

app.get('/browse-locations', function (request, response) {
  response.sendFile(`${__dirname}/views/browse-locations.html`)
})
app.get('/browse-locations/:file', function (request, response) {
  response.sendFile(`${__dirname}/public/${request.params.file}`)
})

app.get('/', function (request, response) {
  response.sendFile(`${__dirname}/views/index.html`)
})

// tokenMiddleware takes care of retrieving and ensuring a token isn't expirted
// makes valid token available on req.cityIqToken
app.get('/assets/', cors(), tokenMiddleware, async function(req, res) {
  try {
    console.log('assets query, zone?', req.query.zone)
    // possible zones:  'SD-IE-ENVIRONMENTAL', 'SD-IE-TRAFFIC', 'SD-IE-PEDESTRIAN', 'SD-IE-PARKING', 'SD-IE-BICYCLE'
    const zone = req.query.zone || 'SD-IE-ENVIRONMENTAL'
    // possible types:  'PKIN', 'PKOUT', 'PEDEVT', 'TFEVT', 'HUMIDITY', 'PRESSURE', 'TEMPERATURE', 'METROLOGY', 'TIMESERIES'
    const type = zoneToDefaultEventType[zone]
    const geoJSON = await getAssets({
      zone,
      type,
      token: req.cityIqToken,
      bbox: req.query.box
    })
    return res.json(geoJSON)
  } catch (error) {
    console.log('caught error', error)
    res.status(500).json({ error: error.message })
  }

  // get asset events for the last 12 hours
  // const timeStart = ciq.timecalc(12)
  // const timeEnd = new Date().getTime() + 10000
  // let retrieved = 0
  // const batchSize = 10
  // while (retrieved < response.content.length) {
  //   console.log('\tgetting batch...total retrieved', retrieved)
  //   const chunk = response.content.slice(retrieved, retrieved + batchSize)
  //   await Promise.all(chunk.map(async asset => {
  //     const assetEvents = await ciq.events('SD-IE-ENVIRONMENTAL', asset.assetUid, 'assetUid', 'TEMPERATURE', timeStart, timeEnd)
  //     asset.events = assetEvents.map(e => convert(e))
  //     asset.properties = asset.events.reduce((accumulator, current) => {
  //       // round to nearest 15 minutes via https://stackoverflow.com/a/10789415/1934
  //       const period = 1000 * 60 * 15;
  //       const date = new Date(current.timestamp);  //or use any other date
  //       const when = new Date(Math.round(date.getTime() / period) * period)
  //       const year = when.getFullYear()
  //       const month = padWithLeadingZero(when.getMonth() + 1)
  //       const day = padWithLeadingZero(when.getDate())
  //       const hours = padWithLeadingZero(when.getHours())
  //       const minutes = padWithLeadingZero(when.getMinutes())
  //       const name = `${year}-${month}-${day}--${hours}h${minutes}m`
  //       accumulator[name] = (current && current.measures) ? current.measures.median : null
  //       return accumulator
  //     }, {})
  //   }))
  //   retrieved += batchSize
  // }
})

app.get('/events/', cors(), tokenMiddleware, async function(req, res) {
  console.log('getting events...', req.query.assetUid)
  const {
    assetUid,
    zone,
    eventType,
    from,
    to,
    timezoneOffset
  } = req.query
  const events = await getEvents({
    id: assetUid,
    token: req.cityIqToken,
    // possible types:  'PKIN', 'PKOUT', 'PEDEVT', 'TFEVT', 'HUMIDITY', 'PRESSURE', 'TEMPERATURE', 'METROLOGY', 'TIMESERIES'
    // type: 'PKIN',
    type: eventType || 'TEMPERATURE',
    // possible zones:  'SD-IE-ENVIRONMENTAL', 'SD-IE-TRAFFIC', 'SD-IE-PEDESTRIAN', 'SD-IE-PARKING', 'SD-IE-BICYCLE'
    zone: zone || 'SD-IE-ENVIRONMENTAL',
    // date format for from and to expected to be YYYY-MM-DD
    start: from,
    stop: to,
    timezoneOffset
  })
  res.json(events)
})

app.get('/locations/', cors(), tokenMiddleware, async function(req, res) {
  const locations = await getLocations({
    // zone: 'SD-IE-TRAFFIC',
    zone: locationTypeToZone[req.query.locationType],
    locationType: req.query.locationType,
    type: 'bbox',
    bbox: req.query.box,
    token: req.cityIqToken
  })
  res.json(locations)
})

const listener = app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${listener.address().port}`)
})
