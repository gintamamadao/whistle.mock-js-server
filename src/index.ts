import { mockServer } from './server'

export default (server /* , options */) => {
  // handle http request
  server.on('request', mockServer)

  // handle websocket request
  server.on('upgrade', (req /* , socket */) => {
    // 修改 websocket 请求用，
    req.passThrough() // 直接透传
  })

  // handle tunnel request
  server.on('connect', (req /* , socket */) => {
    // 修改普通 tcp 请求用
    req.passThrough() // 直接透传
  })
}
