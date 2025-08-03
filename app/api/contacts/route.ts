// app/api/contacts/route.ts
import { NextResponse } from 'next/server'

// This runs only on the server, so your token stays secret
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN!
if (!HUBSPOT_TOKEN) {
  throw new Error('Missing HUBSPOT_TOKEN environment variable')
}

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) {
    return NextResponse.json(
      { error: 'Missing email in request body' },
      { status: 400 }
    )
  }

  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'email', operator: 'EQ', value: email },
        ],
      },
    ],
    properties: [
      'firstname',
      'lastname',
      'email',
      'phone',
      'createdate',
      'lifecyclestage',
      'hs_lead_status',
      'lastmodifieddate',
      'notes_last_contacted',
      'num_notes',
      'total_revenue',
    ],
    limit: 1,
  }

  const resp = await fetch(
    'https://api.hubapi.com/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!resp.ok) {
    // forward status code and message
    const text = await resp.text()
    return NextResponse.json(
      { error: `HubSpot API error: ${text}` },
      { status: resp.status }
    )
  }

  const data = await resp.json()
  return NextResponse.json(data)
}
