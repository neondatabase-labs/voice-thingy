import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function POST(request: Request) {
  const { id, username, message_text } = await request.json()
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await client.connect()
  const result = await client.query(`INSERT INTO messages (session_id, sender, message_text) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING message_id, created_at`, [
    id,
    username,
    message_text,
  ])
  await client.end()
  return NextResponse.json(result.rows[0])
}
