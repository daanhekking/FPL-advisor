import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { Providers } from './providers'

export const metadata = {
  title: 'How DH-to-the-moon beats Sheitlingthorp FC',
  description: 'Fantasy Premier League Analytics and Planning Tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className={GeistSans.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

