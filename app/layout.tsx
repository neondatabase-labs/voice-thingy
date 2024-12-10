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

const btoa = (str: string) => Buffer.from(str).toString('base64')
const images = `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('AI')}`

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    images,
    url: config.url,
    title: config.title,
    description: config.description,
  },
  twitter: {
    images,
    title: config.title,
    card: 'summary_large_image',
    description: config.description,
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
