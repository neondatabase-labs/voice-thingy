'use client'

import Button from '@/components/Button'
import Message from '@/components/Message'
import instructions from '@/lib/instructions'
import { RealtimeEvent } from '@/lib/types'
import { normalizeArray } from '@/lib/utils'
import { WavRecorder, WavStreamPlayer } from '@/lib/wavtools/index.js'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'
import clsx from 'clsx'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, X } from 'react-feather'
import { toast } from 'sonner'

function drawBars(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Float32Array, color: string, pointCount: number = 0, barWidth: number = 200, barSpacing: number = 2, center: boolean = false) {
  pointCount = Math.floor(Math.min(pointCount, (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)))
  if (!pointCount) pointCount = Math.floor((canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing))
  if (!barWidth) barWidth = 200
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(true)
  const wavRecorderRef = useRef<WavRecorder>(new WavRecorder({ sampleRate: 24000 }))
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: 24000 }))
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
  const [allowTheButton, setAllowTheButton] = useState(true)
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState<boolean>(true)
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([])

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    toast('Setting up the conversation...')
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current
    startTimeRef.current = new Date().toISOString()
    setIsConnected(true)
    setRealtimeEvents([])
    if (client) setItems(client.conversation.getItems())
    await wavRecorder.begin()
    await wavStreamPlayer.connect()
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
      toast('You ready to chat with AI.')
    } else toast('Failed to prepare chat with AI.')
    setAllowTheButton(false)
  }, [messages, clientRef.current])

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false)
    const client = clientRef.current
    if (client) client.disconnect()
    const wavRecorder = wavRecorderRef.current
    await wavRecorder.end()
    const wavStreamPlayer = wavStreamPlayerRef.current
    await wavStreamPlayer.interrupt()
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

  /*
   * Sync conversation to Neon database
   */
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
    toast('Setting up OpenAI Realtime (with Braintrust)...')
    fetch('/api/i', { method: 'POST' })
      .then((res) => res.json())
      .then((res) => {
        toast('Succesfully set up OpenAI Realtime client.')
        clientRef.current = new RealtimeClient({ url: 'https://braintrustproxy.com/v1/realtime', apiKey: res.apiKey, dangerouslyAllowAPIKeyInBrowser: true })
      })
      .catch(() => {
        toast('Failed to set up OpenAI Realtime client :/')
      })
  }, [])

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current
      const scrollHeight = eventsEl.scrollHeight
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight
        eventsScrollHeightRef.current = scrollHeight
      }
    }
  }, [realtimeEvents, clientRef.current])

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
            drawBars(clientCanvas, clientCtx, result.values, '#00e599', 200, 2, 2, false)
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
            drawBars(serverCanvas, serverCtx, result.values, '#9333ea', 200, 2, 2, false)
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
  useEffect(() => {
    const wavStreamPlayer = wavStreamPlayerRef.current
    const client = clientRef.current
    if (client) {
      client.updateSession({ instructions: instructions })
      client.updateSession({ input_audio_transcription: { model: 'whisper-1' } })
      client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
        setRealtimeEvents((realtimeEvents) => {
          const lastEvent = realtimeEvents[realtimeEvents.length - 1]
          if (lastEvent?.event.type === realtimeEvent.event.type) {
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

  /**
   * Set if the audio is playing per the current track offset
   */
  useEffect(() => {
    let mountAudioInterval = setInterval(async () => {
      const res = await wavStreamPlayerRef.current.getTrackSampleOffset()
      setIsAudioPlaying(Boolean(res))
    }, 10)
    return () => clearInterval(mountAudioInterval)
  }, [])

  useEffect(() => {
    toast('Fetching conversation history from Neon...')
    fetch('/api/c?id=' + slug)
      .then((res) => res.json())
      .then((res) => {
        toast('Loaded conversation history from Neon succesfully.')
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
      .catch(() => toast('Failed to load conversation history :/'))
      .finally(() => {
        setLoadingMessages(false)
      })
  }, [clientRef.current])

  /**
   * Render the application
   */
  return (
    <>
      <header className="w-full border-b border-white/10 py-1 flex flex-col items-center px-8">
        <div className="w-full flex flex-row items-center justify-between max-w-7xl">
          <Link href="/">
            <span className="text-purple-600">Voice</span>Thingy
          </Link>
          {[...messages, ...items].filter(Boolean).length > 0 ? (
            <button className="text-sm text-white" onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}>
              Show Transcript
            </button>
          ) : (
            <span></span>
          )}
        </div>
      </header>
      <div className="mt-8 flex flex-col w-screen items-center justify-center gap-4 min-h-[calc(100vh-120px)] max-w-7xl">
        {isConnected && (
          <div className="relative flex flex-col items-center">
            <canvas className={clsx('absolute bottom-0 z-40', (!isConnected || !isRecording) && 'hidden')} ref={clientCanvasRef} />
            <canvas className={clsx('absolute bottom-0 z-40', (!isConnected || isRecording || !isAudioPlaying) && 'hidden')} ref={serverCanvasRef} />
            <div className={`absolute w-full h-full rounded-full ${isRecording ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-300`} style={{ opacity: isRecording ? 0.5 : 0.3 }} />
            <div className={`absolute w-full h-full rounded-full border-4 ${isRecording ? 'border-red-800' : 'border-blue-800'} animate-pulse`} />
            <button
              onMouseUp={stopRecording}
              onMouseDown={startRecording}
              disabled={allowTheButton || !isConnected || isAudioPlaying}
              className={`relative z-50 flex items-center justify-center rounded-full w-24 h-24 ${isRecording ? 'bg-red-600' : 'bg-blue-600'} transition-all duration-300`}
            >
              <span className="text-white text-lg">{isRecording ? 'Recording...' : 'Hold to Talk'}</span>
            </button>
          </div>
        )}
        <Button
          disabled={loadingMessages}
          icon={isConnected ? X : Mic}
          iconPosition={isConnected ? 'end' : 'start'}
          onClick={isConnected ? disconnectConversation : connectConversation}
          label={isConnected ? 'End the conversation' : 'Start the conversation'}
          buttonStyle={isConnected ? 'border border-red-500 text-xs text-red-500' : 'bg-[#00e599] text-black'}
        />
      </div>
      {isTranscriptOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black p-4 rounded shadow-lg max-w-[90%] max-h-[90%] overflow-y-scroll">
            <div className="flex flex-row items-center justify-between">
              <span>Transcript</span>
              <button onClick={() => setIsTranscriptOpen(false)}>
                <X />
              </button>
            </div>
            <div data-conversation-content className="border-t py-4 mt-4 flex flex-col gap-y-4">
              {[...messages, ...items].map((conversationItem) => (
                <Message key={conversationItem.id} conversationItem={conversationItem} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const runtime = 'edge'
