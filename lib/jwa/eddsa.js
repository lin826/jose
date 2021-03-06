const { strict: assert } = require('assert')
const { sign: signOneShot, verify: verifyOneShot } = require('crypto')

const { KEYOBJECT } = require('../help/consts')
const { edDSASupported } = require('../help/runtime_support')

const sign = ({ [KEYOBJECT]: keyObject }, payload) => {
  return signOneShot(undefined, payload, keyObject)
}

const verify = ({ [KEYOBJECT]: keyObject }, payload, signature) => {
  return verifyOneShot(undefined, payload, keyObject, signature)
}

module.exports = (JWA, JWK) => {
  assert(!JWA.sign.has('EdDSA'), 'sign alg EdDSA already registered')
  assert(!JWA.verify.has('EdDSA'), 'verify alg EdDSA already registered')

  if (edDSASupported) {
    JWA.sign.set('EdDSA', sign)
    JWA.verify.set('EdDSA', verify)
    JWK.OKP.sign.EdDSA = key => key.private && JWK.OKP.verify.EdDSA(key)
    JWK.OKP.verify.EdDSA = key => (key.use === 'sig' || key.use === undefined) && key.keyObject.asymmetricKeyType.startsWith('ed')
  }
}
