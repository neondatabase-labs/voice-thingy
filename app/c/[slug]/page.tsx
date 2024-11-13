'use client'

/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `pnpm relay`, in parallel with `pnpm start`
 */
const LOCAL_RELAY_SERVER_URL = process.env.NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL as string

import Button from '@/components/Button'
import Message from '@/components/Message'
import instructions from '@/lib/instructions'
import { RealtimeEvent } from '@/lib/types'
import { normalizeArray } from '@/lib/utils'
import { WavRecorder, WavStreamPlayer } from '@/lib/wavtools/index.js'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'
import clsx from 'clsx'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, PlayCircle, StopCircle, X } from 'react-feather'
import NoSSR from 'react-no-ssr'

function drawBars(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  color: string,
  pointCount: number = 0,
  barWidth: number = 0,
  barSpacing: number = 0,
  center: boolean = false,
) {
  pointCount = Math.floor(Math.min(pointCount, (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)))
  if (!pointCount) pointCount = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing))
  if (!barWidth) barWidth = (canvas.width - barSpacing) / pointCount - barSpacing
  const points = normalizeArray(data, pointCount, true)
  for (let i = 0; i < pointCount; i++) {
    const amplitude = Math.abs(points[i])
    const height = Math.max(1, amplitude * canvas.height)
    const x = barSpacing + i * (barWidth + barSpacing)
    const y = center ? (canvas.height - height) / 2 : canvas.height - height
    ctx.fillStyle = color
    ctx.fillRect(x, y, barWidth, height)
  }
}

export default function () {
  const { slug } = useParams<{ slug: string }>()
  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const clientRef = useRef<RealtimeClient>()
  const wavRecorderRef = useRef<WavRecorder>(new WavRecorder({ sampleRate: 24000 }))
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: 24000 }))
  useEffect(() => {
    fetch('/api/i', { method: 'POST' })
      .then((res) => res.json())
      .then((res) => {
        clientRef.current = new RealtimeClient({ url: LOCAL_RELAY_SERVER_URL, apiKey: res.apiKey, dangerouslyAllowAPIKeyInBrowser: true })
      })
  }, [])
  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const eventsScrollHeightRef = useRef(0)
  const eventsScrollRef = useRef<HTMLDivElement>(null)
  const clientCanvasRef = useRef<HTMLCanvasElement>(null)
  const serverCanvasRef = useRef<HTMLCanvasElement>(null)
  const startTimeRef = useRef<string>(new Date().toISOString())
  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   */
  const [items, setItems] = useState<ItemType[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<ItemType[]>([])
  const [loadingMessages, setLoadingMessages] = useState<boolean>(true)
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([])
  /**
   * When you click the API key
   */
  // const resetAPIKey = useCallback(() => {
  //   const apiKey = prompt('OpenAI API Key')
  //   if (apiKey !== null) {
  //     localStorage.clear()
  //     localStorage.setItem('tmp::voice_api_key', apiKey)
  //     window.location.reload()
  //   }
  // }, [])
  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current
    // Set state variables
    startTimeRef.current = new Date().toISOString()
    setIsConnected(true)
    setRealtimeEvents([])
    if (client) setItems(client.conversation.getItems())
    // Connect to microphone
    await wavRecorder.begin()
    // Connect to audio output
    await wavStreamPlayer.connect()
    // Connect to realtime API
    if (client) {
      await client.connect()
      if (messages.length < 1) {
        client.sendUserMessageContent([
          {
            type: `input_text`,
            text: `Hello!`,
          },
        ])
      }
      if (client.getTurnDetectionType() === 'server_vad') await wavRecorder.record((data) => client.appendInputAudio(data.mono))
    }
  }, [messages, clientRef.current])
  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false)
    // setRealtimeEvents([])
    // setItems([])
    const client = clientRef.current
    if (client) client.disconnect()
    // const wavRecorder = wavRecorderRef.current
    // await wavRecorder.end()
    // const wavStreamPlayer = wavStreamPlayerRef.current
    // await wavStreamPlayer.interrupt()
  }, [clientRef.current])
  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const startRecording = async () => {
    setIsRecording(true)
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current
    const trackSampleOffset = await wavStreamPlayer.interrupt()
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset
      if (client) await client.cancelResponse(trackId, offset)
    }
    if (client) await wavRecorder.record((data) => client.appendInputAudio(data.mono))
  }
  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording = async () => {
    setIsRecording(false)
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    await wavRecorder.pause()
    if (client) client.createResponse()
  }
  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current
      const scrollHeight = eventsEl.scrollHeight
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight
        eventsScrollHeightRef.current = scrollHeight
      }
    }
  }, [realtimeEvents, clientRef.current])
  /**
   * Auto-scroll the conversation logs
   */
  const syncConversationItem = async (tmp: any) => {
    let tmpText
    if (tmp.status === 'completed') {
      tmpText = tmp.content[0].transcript || tmp.content[0].text
      if (!tmpText) {
        tmpText = await new Promise((resolve) => {
          const checkText = () => {
            let tmpText = tmp.formatted.transcript || (tmp.formatted.audio?.length ? null : tmp.formatted.text || null)
            if (tmpText) resolve(tmpText)
            else requestAnimationFrame(checkText)
          }
          checkText()
        })
      }
      tmp['content'] = [{ ...tmp['content'][0], transcript: tmpText }]
      delete tmp['formatted']
      return tmp
    }
  }
  const syncConversation = async (items: ItemType[]) => {
    try {
      const [tmp_1, tmp_2] = await Promise.all([syncConversationItem({ ...items[items.length - 1] }), syncConversationItem({ ...items[items.length - 2] })])
      if (tmp_2?.role !== 'user' || tmp_1?.role !== 'assistant' || !tmp_1?.content[0]?.transcript || !tmp_2?.content[0]?.transcript) return
      await fetch('/api/c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: slug, item: tmp_2 }),
      })
      await fetch('/api/c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: slug, item: tmp_1 }),
      })
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => {
    syncConversation(items)
    const conversationEls = [].slice.call(document.body.querySelectorAll('[data-conversation-content]'))
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement
      conversationEl.scrollTop = conversationEl.scrollHeight
    }
  }, [items, clientRef.current])
  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true
    const wavRecorder = wavRecorderRef.current
    const clientCanvas = clientCanvasRef.current
    const serverCanvas = serverCanvasRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current
    let clientCtx: CanvasRenderingContext2D | null = null
    let serverCtx: CanvasRenderingContext2D | null = null
    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth
            clientCanvas.height = clientCanvas.offsetHeight
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d')
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height)
            const result = wavRecorder.recording ? wavRecorder.getFrequencies('voice') : { values: new Float32Array([0]) }
            drawBars(clientCanvas, clientCtx, result.values, '#00e599', 10, 0, 8)
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth
            serverCanvas.height = serverCanvas.offsetHeight
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d')
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height)
            const result = wavStreamPlayer.analyser ? wavStreamPlayer.getFrequencies('voice') : { values: new Float32Array([0]) }
            drawBars(serverCanvas, serverCtx, result.values, '#009900', 10, 0, 8)
          }
        }
        window.requestAnimationFrame(render)
      }
    }
    render()
    return () => {
      isLoaded = false
    }
  }, [clientRef.current])
  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  // @ts-ignore
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current
    const client = clientRef.current
    if (client) {
      // Set instructions
      client.updateSession({ instructions: instructions })
      // Set transcription, otherwise we don't get user transcriptions back
      client.updateSession({ input_audio_transcription: { model: 'whisper-1' } })
      // handle realtime events from client + server for event logging
      client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
        setRealtimeEvents((realtimeEvents) => {
          const lastEvent = realtimeEvents[realtimeEvents.length - 1]
          if (lastEvent?.event.type === realtimeEvent.event.type) {
            // if we receive multiple events in a row, aggregate them for display purposes
            lastEvent.count = (lastEvent.count || 0) + 1
            return realtimeEvents.slice(0, -1).concat(lastEvent)
          }
          return realtimeEvents.concat(realtimeEvent)
        })
      })
      client.on('error', (event: any) => console.error(event))
      client.on('conversation.interrupted', async () => {
        const trackSampleOffset = await wavStreamPlayer.interrupt()
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset
          await client.cancelResponse(trackId, offset)
        }
      })
      client.on('conversation.updated', async ({ item, delta }: any) => {
        const items = client.conversation.getItems()
        if (delta?.audio) wavStreamPlayer.add16BitPCM(delta.audio, item.id)
        if (item.status === 'completed' && item.formatted.audio?.length) item.formatted.file = await WavRecorder.decode(item.formatted.audio, 24000, 24000)
        setItems(items)
      })
      setItems(client.conversation.getItems())
    }
    return () => {
      if (client) client.reset()
    }
  }, [clientRef.current])
  useEffect(() => {
    fetch('/api/c?id=' + slug)
      .then((res) => res.json())
      .then((res) => {
        if (res.length > 0) {
          setMessages(
            res.map((i: any) => ({
              ...i,
              formatted: {
                text: i.content_transcript,
                transcript: i.content_transcript,
              },
            })),
          )
        }
      })
      .finally(() => setLoadingMessages(false))
  }, [clientRef.current])
  /**
   * Render the application
   */
  return (
    <NoSSR>
      <div className="py-24 flex flex-col items-center h-screen w-screen">
        {isConnected && (
          <Button
            iconPosition={'start'}
            disabled={!isConnected}
            onMouseUp={stopRecording}
            onMouseDown={startRecording}
            icon={isRecording ? StopCircle : PlayCircle}
            label={isRecording ? 'Release to send' : 'Hold to speak'}
            buttonStyle={isRecording ? 'bg-rose-100 text-black' : 'bg-blue-100 text-black'}
          />
        )}
        <Button
          disabled={loadingMessages}
          icon={isConnected ? X : Mic}
          iconPosition={isConnected ? 'end' : 'start'}
          label={isConnected ? 'Disconnect Audio' : 'Connect Audio'}
          onClick={isConnected ? disconnectConversation : connectConversation}
          buttonStyle={isConnected ? 'mt-4 bg-red-600 text-white' : 'mt-4 bg-[#00e599] text-black'}
        />
        <div className={clsx(!isRecording && 'hidden', 'contents')}>
          <canvas ref={clientCanvasRef} />
        </div>
        <div className={clsx(isRecording && 'hidden', 'contents')}>
          <canvas ref={serverCanvasRef} />
        </div>
        {[...messages, ...items].length > 0 && (
          <div className="mt-24 flex flex-col border-b">
            <span className="border-b text-sm">Transcript</span>
            <div data-conversation-content className="mt-2 flex flex-col p-4 gap-y-4 overflow-y-scroll max-h-[300px]">
              {[...messages, ...items].map((conversationItem) => (
                <Message key={conversationItem.id} conversationItem={conversationItem} />
              ))}
            </div>
          </div>
        )}
      </div>
    </NoSSR>
  )
}
