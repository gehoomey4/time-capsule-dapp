import './globals.css'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TimeCapsule - Lock Your Future',
  description: 'Lock your Native USDC for the future on Arc Chain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
