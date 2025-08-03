// app/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react'

// Your Google OAuth config
const GOOGLE_CLIENT_ID =
  '954748761187-936nb9vpc10rspeh1gjo1r4lb8dd48dv.apps.googleusercontent.com'
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

// HubSpot contact properties
const HUBSPOT_CONTACT_PROPERTIES = [
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
]

const DowJanesLogo = () => (
  <div className="text-2xl font-semibold text-gray-900">Dow Janes</div>
)

// --------------------------------------------------
// LoginForm (direct OAuth URL)
// --------------------------------------------------
const LoginForm = ({ onLogin, isLoading, error }: any) => {
  const handleGoogleLogin = () => {
    const authUrl =
      'https://accounts.google.com/oauth/authorize?' +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `response_type=token&` +
      `include_granted_scopes=true`
    window.location.href = authUrl
  }

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    if (accessToken) {
      // In prod you'd fetch profile from Google APIs
      onLogin({
        name: 'Coach User',
        email: 'coach@dowjanes.com',
        picture: 'https://via.placeholder.com/40',
        accessToken,
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [onLogin])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-6">
          <DowJanesLogo />
          <p className="text-gray-600 mt-2">
            Sign in with your Google account to continue
          </p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors disabled:bg-gray-100"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">
            Continue with Google
          </span>
        </button>
      </div>
    </div>
  )
}

// --------------------------------------------------
// Client-side proxy to /api/contacts
// --------------------------------------------------
async function fetchHubSpotContact(email: string) {
  if (!email) return null

  const res = await fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    console.warn('HubSpot proxy error', await res.text())
    return null
  }
  const data = await res.json()
  return data.results?.[0] ?? null
}

// --------------------------------------------------
// Create briefing from HubSpot + event
// --------------------------------------------------
function generateBriefingFromHubSpot(hubspotContact: any, event: any) {
  if (!hubspotContact?.properties) {
    return {
      todaysFocus:
        'No HubSpot contact found – focus on general coaching objectives',
      recentContext: 'Contact not found in HubSpot – maybe a new lead',
      clientOverview: 'Client data not available',
      hubspotUrl: 'https://app.hubspot.com/contacts/',
    }
  }
  const p = hubspotContact.properties
  const first = p.firstname || 'Client'
  const last = p.lastname || ''
  const created = p.createdate
    ? new Date(p.createdate).toLocaleDateString()
    : 'Unknown'
  const stage = p.lifecyclestage || 'Unknown'
  const status = p.hs_lead_status || 'Unknown'
  const revenue = p.total_revenue || 'Not tracked'
  const modified = p.lastmodifieddate
    ? new Date(p.lastmodifieddate).toLocaleDateString()
    : 'Unknown'
  const notes = p.num_notes || '0'

  return {
    todaysFocus: `Focus on "${event.summary}" with ${first} ${last}. Stage: ${stage}, Status: ${status}.`,
    recentContext: `Last HubSpot activity: ${modified}. ${notes} notes. Revenue: ${revenue}.`,
    clientOverview: `${first} ${last} • Since ${created} • Stage: ${stage} • Status: ${status} • Revenue: ${revenue}`,
    hubspotUrl: `https://app.hubspot.com/contacts/${hubspotContact.id || ''}`,
  }
}

// --------------------------------------------------
// Fetch coaching events from Google Calendar
// --------------------------------------------------
async function fetchCalendarEvents(date: Date, token: string) {
  if (!token) return []
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  // 1) get calendars
  const calsRes = await fetch(
    `${CALENDAR_API_BASE}/users/me/calendarList?access_token=${token}`
  )
  if (!calsRes.ok) throw new Error('Failed fetching calendars')
  const cals = await calsRes.json()

  // 2) pull "coaching" events
  let coaches: any[] = []
  for (const cal of cals.items || []) {
    const evRes = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(
        cal.id
      )}/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&access_token=${token}`
    )
    if (!evRes.ok) continue
    const evs = await evRes.json()
    const found = evs.items?.filter(
      (e: any) =>
        e.summary?.toLowerCase().includes('coaching') ||
        e.description?.toLowerCase().includes('coaching')
    )
    coaches = coaches.concat(found || [])
  }

  // 3) transform into appointments
  const team = ['Craig Wallace', 'Stephanie V', 'Teri', 'Veronica']
  const result = await Promise.all(
    coaches.map(async (ev: any) => {
      // find coach
      let coachName = 'Unknown Coach'
      for (const a of ev.attendees || []) {
        const em = (a.email || '').toLowerCase()
        const nm = a.displayName || ''
        if (em.includes('craig') || nm.includes('Craig')) coachName = 'Craig Wallace'
        if (em.includes('stephanie') || nm.includes('Stephanie')) coachName = 'Stephanie V'
        if (em.includes('teri') || nm.includes('Teri')) coachName = 'Teri'
        if (em.includes('veronica') || nm.includes('Veronica')) coachName = 'Veronica'
      }

      // find client
      const clients = (ev.attendees || []).filter(
        (a: any) =>
          !team.some((t) =>
            (a.email || '').toLowerCase().includes(t.split(' ')[0].toLowerCase())
          )
      )
      const clientName =
        clients[0]?.displayName ||
        ev.summary.replace(/coaching/i, '').trim() ||
        'Unknown Client'
      const clientEmail = clients[0]?.email || ''
      // fetch HubSpot
      const hubspotContact = clientEmail
        ? await fetchHubSpotContact(clientEmail)
        : null
      const briefing = generateBriefingFromHubSpot(hubspotContact, ev)

      // format times
      const fmt = (dt: string) =>
        new Date(dt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

      return {
        id: ev.id,
        time: `${fmt(ev.start.dateTime || ev.start.date)} - ${fmt(
          ev.end.dateTime || ev.end.date
        )}`,
        coach: coachName,
        client: clientName,
        email: clientEmail,
        programs:
          hubspotContact?.properties?.lifecyclestage === 'customer'
            ? 'Active Customer'
            : 'Lead/Prospect',
        focus: ev.summary || 'Coaching Session',
        briefing,
        raw: ev,
      }
    })
  )

  return result
}

// --------------------------------------------------
// Main Dashboard
// --------------------------------------------------
export default function CoachingDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingAppts, setLoadingAppts] = useState(false)
  const [view, setView] = useState('My Calls')
  const [openId, setOpenId] = useState<string | null>(null)

  const today = new Date()
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  const [currentDate, setCurrentDate] = useState(fmtDate(today))

  // load appointments when user or date changes
  useEffect(() => {
    if (user?.accessToken) loadAppointments()
  }, [user, currentDate])

  async function loadAppointments() {
    if (!user?.accessToken) return
    setLoadingAppts(true)
    setError(null)
    try {
      const evts = await fetchCalendarEvents(
        new Date(currentDate),
        user.accessToken
      )
      setAppointments(evts)
    } catch (err: any) {
      console.error(err)
      setError('Failed to load calendar events')
    } finally {
      setLoadingAppts(false)
    }
  }

  function handleLogin(gu: any) {
    setIsLoading(true)
    setError(null)
    setUser(gu)
    setIsLoading(false)
  }

  function handleLogout() {
    setUser(null)
    setAppointments([])
    setOpenId(null)
  }

  function navigateDate(dir: 'prev' | 'next') {
    const d = new Date(currentDate)
    d.setDate(dir === 'prev' ? d.getDate() - 1 : d.getDate() + 1)
    setCurrentDate(fmtDate(d))
    setOpenId(null)
  }

  if (!user) {
    return (
      <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
    )
  }

  // coach counts
  const coaches = [
    {
      name: 'My Calls',
      count: appointments.filter((a) => a.coach === user.name).length,
    },
    { name: 'All Coaches', count: appointments.length },
    {
      name: 'Craig Wallace',
      count: appointments.filter((a) => a.coach === 'Craig Wallace').length,
    },
    {
      name: 'Stephanie V',
      count: appointments.filter((a) => a.coach === 'Stephanie V').length,
    },
    {
      name: 'Teri',
      count: appointments.filter((a) => a.coach === 'Teri').length,
    },
    {
      name: 'Veronica',
      count: appointments.filter((a) => a.coach === 'Veronica').length,
    },
  ]

  const getBorder = (c: string) => {
    const map: Record<string, string> = {
      'Craig Wallace': 'border-l-4 border-l-purple-400',
      'Stephanie V': 'border-l-4 border-l-teal-700',
      Teri: 'border-l-4 border-l-rose-300',
      Veronica: 'border-l-4 border-l-gray-400',
    }
    return map[c] || 'border-l-4 border-l-gray-300'
  }

  const filtered =
    view === 'My Calls'
      ? appointments.filter((a) => a.coach === user.name)
      : view === 'All Coaches'
      ? appointments
      : appointments.filter((a) => a.coach === view)

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <DowJanesLogo />

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {user.name}
                </span>
                <span className="text-xs text-gray-500">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-lg font-medium text-gray-900">
                {currentDate}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {coaches.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>

            <button
              onClick={loadAppointments}
              disabled={loadingAppts}
              className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#C8BAEE' }}
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingAppts ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {loadingAppts ? (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-3 text-gray-600">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading appointments…</span>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {appointments.length > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>
                  <strong>Connected!</strong> Showing {appointments.length}{' '}
                  coaching appointment
                  {appointments.length !== 1 ? 's' : ''} for {currentDate}.
                </span>
              </div>
            </div>
          )}

          {filtered.length > 0 ? (
            filtered.map((apt) => (
              <div
                key={apt.id}
                className={`bg-white rounded-lg shadow-sm border ${getBorder(
                  apt.coach
                )} hover:shadow-md transition-shadow`}
              >
                <div className="p-6 flex justify-between items-start">
                  <div className="flex-1 space-y-1">
                    <div className="text-lg font-semibold text-gray-900">
                      {apt.time}
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Coach:{' '}
                        <span className="font-medium">{apt.coach}</span>
                      </span>
                    </div>
                    <div className="text-xl font-semibold text-gray-900">
                      {apt.client}
                    </div>
                    <div className="text-sm text-gray-600">
                      {apt.email}
                    </div>
                    <div className="text-sm text-teal-700 font-medium">
                      {apt.programs}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setOpenId(openId === apt.id ? null : apt.id)
                    }
                    className="text-white px-4 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#C8BAEE' }}
                  >
                    {openId === apt.id ? 'Collapse' : 'Expand Briefing'}
                  </button>
                </div>

                {openId === apt.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                    <Section title="Today's Focus">
                      {apt.briefing.todaysFocus}
                    </Section>
                    <Section title="Recent Context">
                      {apt.briefing.recentContext}
                    </Section>
                    <Section title="Client Overview">
                      {apt.briefing.clientOverview}
                      <a
                        href={apt.briefing.hubspotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-teal-700 hover:text-teal-800 text-sm font-medium mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Full HubSpot Profile</span>
                      </a>
                    </Section>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No coaching calls scheduled
              </h3>
              <p className="text-gray-600">
                Make sure your calendar events include “coaching” in the
                title/description for {currentDate}.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  )
}

// --------------------------------------------------
// Helper for sections
// --------------------------------------------------
const Section = ({ title, children }: any) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <div className="bg-white p-4 rounded-lg border">
      <p className="text-gray-700">{children}</p>
    </div>
  </div>
)
