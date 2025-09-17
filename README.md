# School Health & Wellness Website

A comprehensive wellness hub for adolescents and youth, developed by the Government of Karnataka in collaboration with UNICEF and other partners.

## Features

- **Interactive E-Modules**: Learn about Metabolic Health, Road Safety, and HIV Awareness
- **Video Content**: Watch engaging educational videos
- **Quizzes & Certificates**: Take quizzes and earn real-time certificates
- **Resources**: Download health and wellness resources
- **24/7 Helplines**: Access to emergency and support helpline numbers
- **Responsive Design**: Optimized for all devices

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and visit: `http://localhost:3000`

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Project Structure

- `server.js` - Express.js backend server
- `public/` - Frontend static files
  - `index.html` - Main application page
  - `css/styles.css` - Application styling
  - `js/app.js` - Frontend JavaScript
- `data/` - Sample data storage
- `public/videos/` - Video content storage
- `public/images/` - Image assets

## API Endpoints

- `GET /api/modules` - Get all learning modules
- `GET /api/modules/:id` - Get specific module
- `GET /api/quiz/:id` - Get quiz questions
- `POST /api/quiz/:id/submit` - Submit quiz answers
- `GET /api/helplines` - Get helpline numbers
- `GET /api/certificate/:id` - Get certificate details

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, Font Awesome icons
- **Features**: Real-time quiz scoring, certificate generation

## License

This project is developed for educational and public health purposes by the Government of Karnataka in collaboration with UNICEF.