const fetch = require('node-fetch')

module.exports = function request(url, headers, body) {
  const options = {
    headers: headers,
    body: body
  }
  return fetch(url, options).then(result => {
    if (result.status >= 400) {
      return result.statusText
    } else {
      return result.text().then(txt => {
        try {
          return JSON.parse(txt)
        } catch (err) {
          return txt
        }
      })
    }
  })
}
