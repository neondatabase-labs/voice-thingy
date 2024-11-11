import 'dotenv/config'
import RealtimeRelay from './lib/relay'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) throw new Error('Environment variable OPENAI_API_KEY is required. Please set it in your .env file.')

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8081

const relay = new RealtimeRelay(OPENAI_API_KEY)
relay.listen(PORT)
