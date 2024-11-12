import { Client, neonConfig } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

neonConfig.poolQueryViaFetch = true

export async function POST(request: Request) {
  const { id, item } = await request.json()
  if (!id || !item) return NextResponse.json({}, { status: 400 })
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query(
    `INSERT INTO messages (id, session_id, content_type, content_transcript, object, role, status, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
    [item.id, id, item.content[0].type, item.content[0].transcript, item.object, item.role, item.status, item.type],
  )
  return NextResponse.json({})
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json([])
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const { rows } = await client.query(`SELECT * from messages WHERE session_id = $1`, [id])
  await client.end()
  return NextResponse.json(rows)
}
