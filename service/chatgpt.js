const express = require('express')
const localStorage = require('localStorage')
const { openAIKey } = require('../config')
const router = express.Router()

let api = (async () => {
  const { ChatGPTAPI } = await import('chatgpt')
  api = new ChatGPTAPI({ apiKey: openAIKey })
})()

const TIMEOUT_IN_MS = 3600 * 1000; // 1 hour
let timeouts = {};

router.all('/chatgpt', async ({ query: { string, user } }, response) => {
  clearTimeout(timeouts[user]); // 取消之前的超时计时器

  if (string === '/new' || string === '/新问题') {
    // localStorage.setItem(user, JSON.stringify({ messages: [] }))
    localStorage.removeItem(user)
    // 返回一个说明消息
    return response.send({
      choices: [{ message: { content: '🆕我已经忘记之前的对话了，你可以开始问新的问题了。' } }]
    })
  }

  let keychain = openAIKey.split(',')
  let apiKey = ''

  if (localStorage.openAIKey) {
    apiKey = localStorage.openAIKey
  } else {
    apiKey = keychain[0]
    localStorage.setItem('openAIKey', apiKey)
  }

  // 获取该用户的聊天记录数组，如果不存在则新建一个空数组
  const { messages = [] } = JSON.parse(localStorage[user] || '{}')
  let new_question = true
  if (localStorage[user]) {
    new_question = false
  }

  messages.push({ role: 'user', content: string })

  try {
    let parentMessageId
    if (messages.length > 1) {
      parentMessageId = messages[messages.length - 2].id
    }

    const res = await api.sendMessage(string, { parentMessageId })

    messages.push({ role: 'assistant', content: res.text, id: res.id })
    // 针对该用户的聊天记录数组进行操作，最后将结果保存回 localStorage 中
    localStorage.setItem(user, JSON.stringify({ messages }))

    if (new_question) {
      res.text = '🆕这是一个新问题的开始(已闲置超过一小时或刚使用过/new指令)：\n\n' + res.text
    }
    response.send({ choices: [{ message: { content: res.text } }] })
    // 设置超时计时器，1个小时后清空该用户的 messages
    timeouts[user] = setTimeout(() => {
      // localStorage.setItem(user, JSON.stringify({ messages: [] }))
      localStorage.removeItem(user)
    }, TIMEOUT_IN_MS)
  } catch (error) {
    if ([429, 401].includes(error?.response?.status)) {
      let newAIKey = ''
      if (!keychain.includes(apiKey) || keychain.indexOf(apiKey) + 1 >= keychain.length) {
        newAIKey = keychain[0]
      } else {
        newAIKey = keychain[keychain.indexOf(apiKey) + 1]
      }
      localStorage.setItem('openAIKey', newAIKey)
      response.send({
        choices: [
          {
            message: {
              content: `${error.response.status} ${
                error.response.statusText
              } [已切换至openAIKey:${newAIKey.slice(0, 10)}]`
            }
          }
        ]
      })
    } else {
      response.send({
        choices: [{ message: { content: JSON.stringify(error) } }]
      })
    }
  }
})

module.exports = router
