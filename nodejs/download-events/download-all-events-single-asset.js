const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const padWithLeadingZero = require('../../download-point-in-time/padWithLeadingZero')
const {
  getAssets,
  getEvents,
  getToken
} = require('../streetlights')

const DAYS_PER_MONTH = {
  '08': 31,
  '09': 30,
  '10': 31,
  '11': 30,
  '12': 31,
  '01': 31,
  '02': 29,
  '03': 31,
  '04': 30
}
// const MONTHS = ['2019/08/01', '2019/09/01', '2019/10/01', '2019/11/01', '2019/12/01', '2020/01/01', '2020/02/01', '2020/03/01', '2020/04/01']
const MONTHS = ['2019/08', '2019/09', '2019/10', '2019/11', '2019/12', '2020/01', '2020/02', '2020/03', '2020/04']

// const TIME_RANGES = MONTHS.reduce((all, month, index) => {
//   const MONTH_DAYS = DAYS_PER_MONTH[month.split('/')[1]]
//   const DAYS = Array.from(new Array(MONTH_DAYS)).map((d, i) => i + 1).map(day => {
//     return `${month}/${padWithLeadingZero(day)}`
//   })
//   const TIME_RANGES = DAYS.reduce((all, when, index) => {
//     if (DAYS[index + 1]) {
//       all.push([when, DAYS[index + 1]])
//     }
//     return all
//   }, [])
//   return [ ...all, ...TIME_RANGES ]
// }, [])

// console.log('TIME_RANGES', JSON.stringify(TIME_RANGES))
// const DAYS = Array.from(new Array(31)).map((d, i) => i + 1).map(day => {
//   return `2020/01/${padWithLeadingZero(day)}`
// })
const TIMEZONE_OFFSET = new Date().getTimezoneOffset()
const PAGE_SIZE = 10000
const ZONES = [
  { zone: 'SD-IE-ENVIRONMENTAL', types: [ 'TEMPERATURE', 'PRESSURE', 'HUMIDITY' ] },
  { zone: 'SD-IE-TRAFFIC', types: [ 'TFEVT' ] },
  { zone: 'SD-IE-PEDESTRIAN', types: [ 'PEDEVT' ] },
  { zone: 'SD-IE-PARKING', types: [ 'PKIN', 'PKOUT' ] },
  { zone: 'SD-IE-BICYCLE', types: [ 'BICYCLE' ] }
]
const DIR = 'events-all'

const download = async function() {
  // get all traffic events for one sensor...
  // for traffic, this is cam asset from the list of validated assets in marissa's csv
  const ASSET_ID = 'f3f622db-788c-43bb-be23-47683098d5b4'
  const token = await getToken()
  let rangesRetrieved = 0
  let zonesRetrieved = 0
  let typesRetrieved = 0
  const slashReplace = /\//g
  const TIME_RANGES = [
    ['2020/05/01', '2020/05/02']
  ]

  while (rangesRetrieved < TIME_RANGES.length) {
    const range = TIME_RANGES[rangesRetrieved]
    console.log('range', range)
    while (zonesRetrieved < ZONES.length) {
      const { zone, types } = ZONES[zonesRetrieved]
      console.log('\tzone', zone)
      while (typesRetrieved < types.length) {
        console.log('\t\ttype', types[typesRetrieved])
        const assetEvents = await getEvents({
          zone: zone, //'SD-IE-TRAFFIC',
          id: ASSET_ID,
          idType: 'assetUid',
          type: types[typesRetrieved], //'TFEVT',
          start: range[0],
          stop: range[1],
          timezoneOffset: TIMEZONE_OFFSET,
          token,
          pageSize: PAGE_SIZE
        })
        const start = range[0].replace(slashReplace, '-')
        const end = range[1].replace(slashReplace, '-')
        const currentFile = `${DIR}/${zone}_${types[typesRetrieved]}_${start}__${end}.json`
        console.log('event count', assetEvents.length)
        await writeFile(currentFile, JSON.stringify(assetEvents))
        typesRetrieved += 1
      }
      typesRetrieved = 0
      zonesRetrieved += 1
    }
    rangesRetrieved += 1
  }
  console.log('finished loops.')
}

download()
