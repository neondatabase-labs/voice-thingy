export const dynamic = 'force-dynamic'

export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

export async function POST() {
  const response = await fetch(`https://braintrustproxy.com/v1/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BRAINTRUST_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-10-01',
      ttl_seconds: 60 * 10,
      logging: {
        project_name: 'My project',
      },
    }),
  })
  const { key: apiKey } = await response.json()
  return NextResponse.json({ apiKey })
}
