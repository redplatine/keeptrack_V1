import './globals.css'

export const metadata = {
  title: 'KeepTrack',
  description: 'GTA Specialist Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}