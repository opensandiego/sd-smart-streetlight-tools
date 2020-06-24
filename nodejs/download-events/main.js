const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const padWithLeadingZero = require('../../download-point-in-time/padWithLeadingZero')
const {
  getAssets,
  getEvents,
  getToken
} = require('../streetlights')

const download = async function() {
  const bbox = '32.7412:-117.1613,32.7602:-117.1312'
  // const ciqInfo = {
  //   ...credentials,
  // }
  // const pageSize = 2000
  // const ciq = await cityiq(ciqInfo)
  // const response = await ciq.assets('SD-IE-ENVIRONMENTAL', 'TEMPERATURE', undefined, pageSize)
  const token = await getToken()
  const geoJSON = await getAssets({
    zone: 'SD-IE-ENVIRONMENTAL',
    type: 'TEMPERATURE',
    token,
    bbox
  })
  // only get events from online assets
  // response.content = response.content.filter(asset => asset.status === 'ONLINE')
  // TODO:  save offline assets somewhere...put that on a map too
  geoJSON.features = geoJSON.features.filter(asset => asset.properties.status === 'ONLINE')
  console.log(`number of assets: ${geoJSON.features.length}`)
  let retrieved = 0
  const batchSize = 10
  while (retrieved < geoJSON.features.length) {
    console.log('\tgetting batch...total retrieved', retrieved)
    const chunk = geoJSON.features.slice(retrieved, retrieved + batchSize)
    await Promise.all(chunk.map(async asset => {
      const assetEvents = await getEvents({
        zone: 'SD-IE-ENVIRONMENTAL',
        id: asset.properties.assetUid,
        idType: 'assetUid',
        type: 'TEMPERATURE',
        token
      })
      asset.properties.events = assetEvents.reduce((accumulator, current) => {
        // round to nearest 15 minutes via https://stackoverflow.com/a/10789415/1934
        const period = 1000 * 60 * 15;
        const date = new Date(current.timestamp);  //or use any other date
        const when = new Date(Math.round(date.getTime() / period) * period)
        const year = when.getFullYear()
        const month = padWithLeadingZero(when.getMonth() + 1)
        const day = padWithLeadingZero(when.getDate())
        const hours = padWithLeadingZero(when.getHours())
        const minutes = padWithLeadingZero(when.getMinutes())
        const name = `${year}-${month}-${day}--${hours}h${minutes}m`
        accumulator[name] = (current) ? current.median : null
        return accumulator
      }, {})
    }))
    retrieved += batchSize
  }
  console.log('\n\nFinished downloading data.')

  const timestamps = Object.keys(geoJSON.features[0].properties.events)
  console.log('times', timestamps)

  const out = `assets.geojson`
  const writeError = await writeFile(out, JSON.stringify(geoJSON, null, 2))
  if (writeError) {
    console.log(`error writing ${out}:`, writeError)
  } else {
    console.log(`wrote ${out}`)
  }
}

download()
