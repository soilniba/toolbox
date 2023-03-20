const express = require('express')
const { decrypt, getSignature } = require('@wecom/crypto')
const { wecomEncodingAESKey, wecomToken, TOOLBOX_BASE_URL } = require('../config')
const xmlparser = require('express-xml-bodyparser')
const xml2js = require('xml2js')
const router = express.Router()
const axios = require('axios')

router.all(
  '/wecom/notice',
  xmlparser({ trim: true, explicitArray: false }),
  async ({ query: { msg_signature, timestamp, nonce, echostr }, body: { xml } }, response) => {
    try {
      if (echostr) {
        const signature = getSignature(wecomToken, timestamp, nonce, echostr)
        if (signature !== msg_signature) {
          response.send('')
        } else {
          const { message } = decrypt(wecomEncodingAESKey, echostr)
          response.send(message)
        }
        return
      }
      const { message } = decrypt(wecomEncodingAESKey, xml.encrypt)
      const {
        xml: { FromUserName, Content, MsgType }
      } = await xml2js.parseStringPromise(message)
      console.log(`Received content：${Content}`)
      const encodedContent = encodeURIComponent(Content);
      axios.get(
        `${TOOLBOX_BASE_URL}/wecom/send?string=${encodedContent}&user=${FromUserName[0]}&type=${MsgType}`
      )
      response.send('')
    } catch (error) {
      console.log(error)
      response.send('')
    }
  }
)

module.exports = router
