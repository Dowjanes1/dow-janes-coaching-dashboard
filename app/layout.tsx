import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dow Janes Coaching Dashboard',
  description: 'Internal coaching dashboard with Google Calendar and HubSpot integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
