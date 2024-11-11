import { RealtimeClient } from '@openai/realtime-api-beta'
import { WebSocketServer } from 'ws'

export class RealtimeRelay {
  wss: any
  apiKey: any
  sockets: any
  constructor(apiKey: string) {
    this.wss = null
    this.apiKey = apiKey
    this.sockets = new WeakMap()
  }
  listen(port: number) {
    this.wss = new WebSocketServer({ port })
    this.wss.on('connection', this.connectionHandler.bind(this))
    this.log(`Listening on ws://localhost:${port}`)
  }
  // @ts-ignore
  async connectionHandler(ws, req) {
    if (!req.url) {
      this.log('No URL provided, closing connection.')
      ws.close()
      return
    }
    const url = new URL(req.url, `http://${req.headers.host}`)
    const pathname = url.pathname
    if (pathname !== '/') {
      this.log(`Invalid pathname: "${pathname}"`)
      ws.close()
      return
    }
    // Instantiate new client
    this.log(`Connecting with key "${this.apiKey.slice(0, 3)}..."`)
    const client = new RealtimeClient({ apiKey: this.apiKey })
    // Relay: OpenAI Realtime API Event -> Browser Event
    // @ts-ignore
    client.realtime.on('server.*', (event) => {
      this.log(`Relaying "${event.type}" to Client`)
      ws.send(JSON.stringify(event))
    })
    client.realtime.on('close', () => ws.close())
    const messageQueue: any = []
    // @ts-ignore
    const messageHandler = (data) => {
      try {
        const event = JSON.parse(data)
        this.log(`Relaying "${event.type}" to OpenAI`)
        client.realtime.send(event.type, event)
      } catch (e) {
        // @ts-ignore
        console.error(e.message)
        this.log(`Error parsing event from client: ${data}`)
      }
    }
    // @ts-ignore
    ws.on('message', (data) => {
      if (!client.isConnected()) {
        messageQueue.push(data)
      } else {
        messageHandler(data)
      }
    })
    ws.on('close', () => client.disconnect())
    try {
      this.log(`Connecting to OpenAI...`)
      await client.connect()
    } catch (e) {
      // @ts-ignore
      this.log(`Error connecting to OpenAI: ${e.message}`)
      ws.close()
      return
    }
    this.log(`Connected to OpenAI successfully!`)
    while (messageQueue.length) {
      messageHandler(messageQueue.shift())
    }
  }
  // @ts-ignore
  log(...args) {
    console.log(`[RealtimeRelay]`, ...args)
  }
}

exports.RealtimeRelay = RealtimeRelay
