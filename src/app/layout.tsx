import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACR Automotive',
  description: 'Auto parts cross-reference search system for ACR Automotive',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}