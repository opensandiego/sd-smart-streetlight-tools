const convert = function (e) {
  const { unit, powerOf10 } = e.properties
  if (unit === 'PERCENT') {
    Object.keys(e.measures).forEach(measure => {
      e.measures[measure] = parseFloat((e.measures[measure] * Math.pow(10, powerOf10)).toFixed(2))
    })
    e.properties.unit = '%'
  }
  if (unit === 'KELVIN') {
    Object.keys(e.measures).forEach(measure => {
      const celsius = e.measures[measure] * Math.pow(10, powerOf10) - 273.15
      const fahrenheit = (celsius * (9/5)) + 32
      e.measures[measure] = parseFloat((fahrenheit).toFixed(2))
    })
    e.properties.unit = 'F'
  }
  if (unit === 'PASCALS') {
    Object.keys(e.measures).forEach(measure => {
      e.measures[measure] = e.measures[measure] / 100
    })
    e.properties.unit = 'mb'
  }
  return e
}

module.exports = convert