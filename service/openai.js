const express = require('express')
const router = express.Router()
const localStorage = require('localStorage')

const { openAIKey } = require('../config')
const { Configuration, OpenAIApi } = require('openai')

router.all('/openai', async ({ query: { string } }, response) => {
  let keychain = openAIKey.split(',')
  let apiKey = ''
  let messages = []

  if (localStorage.openAIKey) {
    apiKey = localStorage.openAIKey
  } else {
    apiKey = keychain[0]
    localStorage.setItem('openAIKey', apiKey)
  }

  if (localStorage.messages) {
    messages = JSON.parse(localStorage.messages)
  }

  messages.push({ role: 'user', content: string })
  try {
    const configuration = new Configuration({
      apiKey: apiKey,
      serverUrl: OPENAI_API_URL
    })
    const openai = new OpenAIApi(configuration)
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages
    })
    messages.push(completion.data.choices[0].message)
    localStorage.setItem('messages', JSON.stringify(messages))
    response.send({
      choices: completion.data.choices
    })
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
