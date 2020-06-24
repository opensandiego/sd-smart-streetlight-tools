function btoa (str) {
  return new Buffer.from(str).toString('base64')
}

function makeHeaders (token, zone) {
  return {
    authorization: `Bearer ${token}`,
    'predix-zone-id': zone
  }
}

function logResponseMetadata (response) {
  const responseMetadata = Object.keys(response).filter(key => key !== 'content').reduce((acc, cur) => {
    acc[cur] = response[cur]
    return acc
  }, {})
  console.log('responseMetadata', responseMetadata)
}

module.exports = {
  btoa,
  makeHeaders,
  logResponseMetadata
}
