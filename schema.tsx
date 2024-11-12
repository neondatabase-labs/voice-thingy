import 'dotenv/config'
import { Client } from 'pg'

const createMessagesTable = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const createTableQuery = `CREATE TABLE IF NOT EXISTS messages (created_at SERIAL, id TEXT PRIMARY KEY, session_id TEXT, content_type TEXT, content_transcript TEXT, object TEXT, role TEXT, status TEXT, type TEXT);`
    const createIndexQuery = `CREATE INDEX IF NOT EXISTS idx_session_created_at ON messages (session_id, created_at);`
    await client.query(createTableQuery)
    await client.query(createIndexQuery)
  } catch (error) {
    console.error(error)
  } finally {
    await client.end()
  }
}

createMessagesTable()
