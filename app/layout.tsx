import '@/globals.css'
import config from '@/lib/config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    title: config.title,
    description: config.description,
    url: config.url,
    images: config.ogImage,
  },
  twitter: {
    card: 'summary_large_image',
    title: config.title,
    description: config.description,
    images: config.ogImage,
  },
}

export default function ({
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
