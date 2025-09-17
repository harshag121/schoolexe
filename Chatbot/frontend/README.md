# AdolAI Chatbot Frontend

A Next.js frontend for the Teen Health Chatbot, designed to match the reference interface provided.

## Features

- Clean chat interface matching the reference design
- Emoji selector for mood tracking
- Real-time messaging with the FastAPI backend
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Make sure your backend is running on `http://localhost:8000`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page with chat
│   └── globals.css      # Global styles
├── components/
│   ├── ChatInterface.tsx    # Main chat component
│   └── EmojiSelector.tsx    # Emoji selection component
├── lib/
│   └── api.ts              # API client for backend
└── package.json
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
npm start
```