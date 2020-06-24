const loginCredentials = {
  name: 'sandiego',
  uaa: 'https://auth.aa.cityiq.io/',
  eventservice: 'https://sandiego.cityiq.io/api/v2/',
  metadataservice: 'https://sandiego.cityiq.io/api/v2/',
  mediaservice: 'https://sandiego.cityiq.io/api/v2/',
  websocket: 'wss://{yourWebSocketURL}', // Necessary only for websocket.js
  // https://www.sandiego.gov/sustainability/energy-and-water-efficiency/programs-projects/smart-city
  // 'developer' is a combination of client ID and client from the URL above
  developer: 'PublicAccess:qPKIadEsoHjyh226Snz7',
  parking: 'SD-IE-PARKING',
  environment: 'SD-IE-ENVIRONMENTAL',
  pedestrian: 'SD-IE-PEDESTRIAN',
  traffic: '{your-Traffic-PredixZoneID}',
  video: '{your-Video-PredixZoneID}',
  images: '{your-Images-PredixZoneID}',
  bbox_allSD: '32.46:-117.66,33.37:-116.67',
  bbox: '32.7187:-117.1681,32.7667:-117.1175'
}

module.exports = loginCredentials
