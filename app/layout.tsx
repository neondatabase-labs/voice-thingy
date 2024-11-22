import '@/globals.css'
import config from '@/lib/config'
import clsx from 'clsx'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Footer from './components/Footer'

const interFont = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    title: config.title,
    description: config.description,
    url: config.url,
    images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('AI')}`,
  },
  twitter: {
    card: 'summary_large_image',
    title: config.title,
    description: config.description,
    images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('AI')}`,
  },
}

export default function ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={clsx(interFont.className, 'bg-black text-gray-400 items-center flex flex-col')}>
        <Toaster />
        {children}
        <Footer />
      </body>
    </html>
  )
}
