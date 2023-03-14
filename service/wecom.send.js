const express = require('express')
const localStorage = require('localStorage')
const {
  wecomAgentId,
  wecomCorpid,
  wecomSecret,
  WECOM_BASE_URL,
  TOOLBOX_BASE_URL
} = require('../config')
const axios = require('axios')
const router = express.Router()

router.all('/wecom/send', async ({ query: { string, user, type } }, response) => {
  try {
    if (!localStorage.access_token) {
      const {
        data: { access_token }
      } = await axios.get(
        `${WECOM_BASE_URL}/cgi-bin/gettoken?corpid=${wecomCorpid}&corpsecret=${wecomSecret}`
      )
      localStorage.setItem('access_token', access_token)
    }
    console.log(`Access Token: ${localStorage.access_token}`)
    const { data } = await axios.get(`${TOOLBOX_BASE_URL}/openai?string=${string}&user=${user}`)
    console.log(`Reply content: ${data.choices[0].message.content.trim()}`)
    const status = await axios.post(
      `${WECOM_BASE_URL}/cgi-bin/message/send?access_token=${localStorage.access_token}`,
      {
        touser: user,
        msgtype: type,
        agentid: wecomAgentId,
        text: {
          content: data.choices[0].message.content.trim()
        }
      }
    )
    console.log(`Send Status: ${JSON.stringify(status.data)}`)
    if ([40014,42201,42001].includes(status.data.errcode)) {
      localStorage.removeItem('access_token')
      await axios.get(`${TOOLBOX_BASE_URL}/wecom/send?string=${string}&user=${user}&type=${type}`)
    }
    response.send('')
  } catch (error) {
    console.log(error)
    response.send('')
  }
})

module.exports = router
