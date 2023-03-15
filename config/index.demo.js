module.exports = {
  wecomAgentId: null, // 企业微信应用 agentId
  wecomToken: '', // 企业微信应用 token
  wecomEncodingAESKey: '', // 企业微信应用 encodingAESKey
  wecomCorpid: '', // 企业微信应用 corp_id
  wecomSecret: '', // 企业微信应用 app_secret
  openAIKey: '', // openAIKey
  port: null, // 服务运行端口号 port
  OPENAI_API_URL: 'https://api.openai.com', // OpenAI的api地址，若使用第三方服务器可替换该地址
  WECOM_BASE_URL: 'https://qyapi.weixin.qq.com', // 企业微信应用 WECOM_BASE_URL (请保留该默认字段)
  TOOLBOX_BASE_URL: 'http://127.0.0.1' // 本地请求路径 TOOLBOX_BASE_URL (请保留该默认字段)
}
