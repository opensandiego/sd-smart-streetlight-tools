const subHours = require('date-fns/subHours')
const format = require('date-fns/format')
const { URLSearchParams } = require('url')
const request = require('./city-iq-request')
const {
  uaa,
  developer,
  metadataservice,
  eventservice
} = require('./san-diego-info')
const convert = require('./convert')
const {
  btoa,
  makeHeaders,
  logResponseMetadata
} = require('./utils')
const {
  EVENT_TYPES,
  MEDIA_TYPES,
  ASSET_TYPES,
  SENSOR_TYPES,
  LOCATION_TYPES,
  PAGE_SIZE,
  FAILURE_RESPONSES
} = require('./constants')

const getToken = async function() {
  const response = await request(`${uaa}oauth/token?grant_type=client_credentials`, {
    authorization: `Basic ${btoa(developer)}`
  })
  return response.access_token
}

const getAssets = async function({ zone, type, id, bbox, token }) {
  let path = 'metadata/assets/'
  let query = {}
  /**If statements specify each query for each search parameter.
   * Default is to search assets by assetUid */
  if (EVENT_TYPES.includes(type)) {
    path = `${path}search?`
    query.bbox = bbox
    query.q = `eventTypes:${type}`
    query.size = PAGE_SIZE
  } else if (MEDIA_TYPES.includes(type)) {
    path = `${path}search?`
    query.bbox = bbox
    query.q = `mediaType:${type}`
  } else if (ASSET_TYPES.includes(type)) {
    path = `${path}search?`
    query.bbox = bbox
    query.q = `assetType:${type}`
  } else if (id !== undefined && type === 'children') {
    path = `${path}${id}/subAssets`
  } else {
    query = type
  }

  const queryString = new URLSearchParams(query).toString()
  const url = `${metadataservice}${path}${queryString}`
  console.log(`getAssets: ${url}`)

  const response = await request(url, makeHeaders(token, zone))
  if (typeof response === 'string' && FAILURE_RESPONSES.includes(response.toLowerCase())) {
    console.log('failed...response', response)
    throw new Error('Asset query failed')
  }
  // logResponseMetadata(response)

  // const zones = ['SD-IE-ENVIRONMENTAL', 'SD-IE-TRAFFIC', 'SD-IE-PEDESTRIAN', 'SD-IE-PARKING', 'SD-IE-BICYCLE']

  // build a geoJSON feature collection
  const fc = {
    type: 'FeatureCollection',
    features: response.content.map(asset => {
      const [latitude, longitude] = asset.coordinates.split(':')
      return {
        type: 'Feature',
        properties: { ...asset },
        geometry: {
          type: 'Point',
          coordinates: [+longitude, +latitude]
        }
      }
    })
  }
  return fc
}

const getEvents = async function({
  zone = 'SD-IE-ENVIRONMENTAL',
  id = '',
  idType = 'assetUid',
  type = 'TEMPERATURE',
  start,
  stop,
  timezoneOffset,
  token,
  pageSize = PAGE_SIZE
}) {
  let path
  let query = {}
  let utcDifference
  if (!start && !stop) {
    // get last twelve hours if start and stop aren't specified
    stop = new Date()
    start = subHours(stop, 12)
    utcDifference = stop.getTimezoneOffset() * 60 * 1000
  } else {
    // client sends timestamps from the browser's timezone
    // timezoneOffset is minutes behind or ahead of UTC
    // use that to get a UTC time to use for API queries
    utcDifference = timezoneOffset * 60 * 1000
    start = new Date(new Date(start).getTime() + utcDifference)
    stop = new Date(new Date(stop).getTime() + utcDifference)
  }
  // console.log('\nget events, type:', type)
  // console.log('eventservice', eventservice)

  if (EVENT_TYPES.includes(type) && EVENT_TYPES.indexOf(type) <= 3) {
    if (idType == 'assetUid') {
      console.debug('querying events by asset, eventTypes and time span')
      path = 'event/assets/'+id+'/events?'
      query.eventType = type
    } else if (idType == 'locationUid') {
      // TODO:  use path and query instead of just query
      console.debug('querying events by locationUid, eventType, and time span')
      query = 'locations/'+id+'/events?eventType='+type
    } else {
      // TODO:  use path and query instead of just query
      console.debug('querying events by location, eventType and time span')
      query = 'locations/events?eventTypes='+type+'&bbox='+bbox
    }
  } else if (EVENT_TYPES.indexOf(type) >= 4) {
    console.debug ('querying events by asset, eventTypes and time span')
    path = `event/assets/${id}/events?`
    query.eventType = type
  } else if (MEDIA_TYPES.indexOf(type) >= 0) {
    // TODO:  everything in this block needs to use path and query instead of just query
    if (idType == 'assetUid') {
      console.debug('querying events by asset, assetType and time span')
      query = 'event/assets/'+id+'/events?assetType='+type
    } else if (idType == 'locationUid') {
      console.debug('querying events by locationUid, assetType, and time span')
      query = 'locations/'+id+'/events?assetType='+type
    } else {
      console.debug('querying events by location, assetType and time span')
      query = 'locations/events?assetType='+type+'&bbox='+coord
    }
  } else {
    console.debug('querying assets by externalRefId')
    query = 'assets/'+id+'/events?externalRefId='+type
  }

  query.startTime = start.getTime()
  query.endTime = stop.getTime()
  query.pageSize = pageSize
  const queryString = new URLSearchParams(query).toString()
  const url = `${eventservice}${path}${queryString}`
  console.log(`getEvents:  ${url}`)

  let response = await request(url, makeHeaders(token, zone))
  if (response.content) {
    response.content = response.content.map(event => convert(event))
    // if (utcDifference) {
    //   // add a readable timestamp as "when"
    //   response.content = response.content.map(event => {
    //     if (event.timestamp) {
    //       // event.timestamp += utcDifference
    //       event.when = format(new Date(event.timestamp), 'yyyy-MM-dd hh:mm:ss a')
    //     }
    //     return event
    //   })
    // }
    if (type === 'TEMPERATURE') {
      // do some extra formatting so download as .csv works
      response.content = response.content.map(event => {
        const flat = Object.entries(event).reduce((accumulator, [key, value]) => {
          if (typeof value === 'object') {
            accumulator = {
              ...accumulator,
              ...value
            }
            // Object.keys(value).forEach(nestedKey => accumulator[nestedKey] = value[nestedKey])
          } else {
            accumulator[key] = value
          }
          return accumulator
        }, {})
        return flat
      })
    }
  }
  logResponseMetadata(response)
  return response.content
}

const getLocations = async function({ zone, locationType, type, bbox, token }) {
  let path
  let query = {
    q: `locationType:${locationType}`,
    size: PAGE_SIZE
  }

  if (type === 'bbox') {
    path = 'metadata/locations/search?'
    query.bbox = bbox
  } else if (LOCATION_TYPES.includes(type)) {
    console.log('\tloc types else if')
    path = 'metadata/locations/search?'
    query.bbox = bbox
    query.q = `locationType:${type}`
  } else {
    path = `metadata/locations/${type}`
  }

  const queryString = new URLSearchParams(query).toString()
  const queryURL = `${metadataservice}${path}${queryString}`
  console.log(`getLocations: ${queryURL}`)

  // console.log('locations zone', zone)
  let response = await request(queryURL, makeHeaders(token, zone))
  // logResponseMetadata(response)

  const fc = {
    type: 'FeatureCollection',
    features: response.content.map(location => {
      const coordinatePairs = location.coordinates.split(',').map(pair => {
        const [ y, x ] = pair.split(':')
        return [ +x, +y ]
      })
      // coordinatePairs.push([ ...coordinatePairs[0] ])
      const path = [ coordinatePairs ]
      const properties = { ...location }
      delete properties.coordinates
      return {
        type: 'Feature',
        properties,
        geometry: {
          type: 'LineString',
          coordinates: coordinatePairs
        }
      }
    })
  }
  return fc
}

const getAssetById = async function ({ id, zone, token }) {
  const url = `${metadataservice}metadata/assets/${id}`
  const response = await request(url, makeHeaders(token, zone))
  if (response === 'Unauthorized') {
    throw new Error('Unauthorized')
  }
  return response
}

const streetlights = {
  getToken,
  getAssets,
  getEvents,
  getLocations,
  getAssetById
}

module.exports = streetlights
