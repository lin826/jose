const { strict: assert } = require('assert')
const { publicEncrypt, privateDecrypt, constants } = require('crypto')

const { oaepHashSupported } = require('../help/runtime_support')
const { KEYOBJECT } = require('../help/consts')
const { asInput } = require('../help/key_object')

const resolvePadding = (alg) => {
  switch (alg) {
    case 'RSA-OAEP-256':
    case 'RSA-OAEP':
      return constants.RSA_PKCS1_OAEP_PADDING
    case 'RSA1_5':
      return constants.RSA_PKCS1_PADDING
  }
}

const resolveOaepHash = (alg) => {
  switch (alg) {
    case 'RSA-OAEP-256':
      return 'sha256'
    case 'RSA-OAEP':
      return 'sha1'
    default:
      return undefined
  }
}

const wrapKey = (padding, oaepHash, { [KEYOBJECT]: keyObject }, payload) => {
  const key = asInput(keyObject, true)
  return { wrapped: publicEncrypt({ key, oaepHash, padding }, payload) }
}

const unwrapKey = (padding, oaepHash, { [KEYOBJECT]: keyObject }, payload) => {
  const key = asInput(keyObject, false)
  return privateDecrypt({ key, oaepHash, padding }, payload)
}

const LENGTHS = {
  RSA1_5: 0,
  'RSA-OAEP': 592,
  'RSA-OAEP-256': 784
}

module.exports = (JWA, JWK) => {
  const algs = ['RSA-OAEP', 'RSA1_5']

  if (oaepHashSupported) {
    algs.splice(1, 0, 'RSA-OAEP-256')
  }

  algs.forEach((jwaAlg) => {
    const padding = resolvePadding(jwaAlg)
    const oaepHash = resolveOaepHash(jwaAlg)

    assert(!JWA.keyManagementEncrypt.has(jwaAlg), `keyManagementEncrypt alg ${jwaAlg} already registered`)
    assert(!JWA.keyManagementDecrypt.has(jwaAlg), `keyManagementDecrypt alg ${jwaAlg} already registered`)

    JWA.keyManagementEncrypt.set(jwaAlg, wrapKey.bind(undefined, padding, oaepHash))
    JWA.keyManagementDecrypt.set(jwaAlg, unwrapKey.bind(undefined, padding, oaepHash))
    JWK.RSA.wrapKey[jwaAlg] = key => (key.use === 'enc' || key.use === undefined) && key.length >= LENGTHS[jwaAlg]
    JWK.RSA.unwrapKey[jwaAlg] = key => key.private && (key.use === 'enc' || key.use === undefined) && key.length >= LENGTHS[jwaAlg]
  })
}
