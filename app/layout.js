import './globals.css'
import { EntrepriseProvider } from '../lib/EntrepriseContext'

export const metadata = {
  title: 'KeepTrack',
  description: 'GTA Specialist Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <EntrepriseProvider>
          {children}
        </EntrepriseProvider>
      </body>
    </html>
  )
}