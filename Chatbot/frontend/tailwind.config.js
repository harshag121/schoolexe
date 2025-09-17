/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#f5f5f5',
        'message-user': '#007bff',
        'message-bot': '#ffffff',
        'emoji-selected': '#ffd700',
      },
    },
  },
  plugins: [],
}