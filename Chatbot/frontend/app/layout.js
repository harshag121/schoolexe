import './globals.css'

export const metadata = {
  title: 'AdolAI Chatbot',
  description: 'Teen Health Chatbot for adolescent health education',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}