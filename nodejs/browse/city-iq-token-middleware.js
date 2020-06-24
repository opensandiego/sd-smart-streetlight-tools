const jwtDecode = require('jwt-decode')
const { getToken } = require('../streetlights')

// keep track of token used to access city iq resources
let token

function tokenExpired() {
  const decoded = jwtDecode(token)
  const expiration = new Date(decoded.exp * 1000)
  const now = new Date()
  return now > expiration
}

const tokenMiddleware = async (req, res, next) => {
  // console.time('tokenMiddleware')
  if (!token || tokenExpired()) {
    token = await getToken()
  }
  req.cityIqToken = token
  // console.timeEnd('tokenMiddleware')
  next()
}

module.exports = tokenMiddleware
