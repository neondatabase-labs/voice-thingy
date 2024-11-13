import '@/globals.css'
import config from '@/lib/config'
import { Metadata } from 'next'
import Footer from './components/Footer'
import Header from './components/Header'

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
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
