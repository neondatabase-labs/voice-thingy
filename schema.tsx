import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const createMessagesTable = async () => {
  if (!process.env.DATABASE_URL) throw new Error(`DATABASE_URL environment variable not found.`)
  const sql = neon(process.env.DATABASE_URL)
  try {
    await sql(`CREATE TABLE IF NOT EXISTS messages (created_at SERIAL, id TEXT PRIMARY KEY, session_id TEXT, content_type TEXT, content_transcript TEXT, object TEXT, role TEXT, status TEXT, type TEXT);`)
    await sql(`CREATE INDEX IF NOT EXISTS idx_session_created_at ON messages (session_id, created_at);`)
    console.log('Setup schema succesfully.')
  } catch (error) {
    console.error(error)
    console.log('Failed to set up schema.')
  }
}

createMessagesTable()
