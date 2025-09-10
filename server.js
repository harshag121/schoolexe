const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles/scripts for demo
}));
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Sample data for the wellness platform
const modules = [
  {
    id: 1,
    title: "Metabolic Health",
    description: "Learn about nutrition, exercise, and maintaining a healthy metabolism",
    videoUrl: "/videos/metabolic-health.mp4",
    quizId: 1,
    resources: [
      "Healthy eating guidelines",
      "Exercise routines for teenagers",
      "Understanding BMI and metabolic rate"
    ]
  },
  {
    id: 2,
    title: "Road Safety",
    description: "Essential road safety tips and traffic rules for young adults",
    videoUrl: "/videos/road-safety.mp4",
    quizId: 2,
    resources: [
      "Traffic rules handbook",
      "Safe driving practices",
      "Emergency contact numbers"
    ]
  },
  {
    id: 3,
    title: "HIV Awareness",
    description: "Understanding HIV/AIDS prevention, testing, and support",
    videoUrl: "/videos/hiv-awareness.mp4",
    quizId: 3,
    resources: [
      "HIV prevention methods",
      "Testing centers near you",
      "Support groups and counseling"
    ]
  }
];

const quizzes = {
  1: {
    id: 1,
    title: "Metabolic Health Quiz",
    questions: [
      {
        id: 1,
        question: "What is the recommended daily water intake for teenagers?",
        options: ["4-6 glasses", "6-8 glasses", "8-10 glasses", "10-12 glasses"],
        correct: 2
      },
      {
        id: 2,
        question: "Which nutrient is most important for muscle building?",
        options: ["Carbohydrates", "Proteins", "Fats", "Vitamins"],
        correct: 1
      },
      {
        id: 3,
        question: "How many minutes of exercise are recommended daily for teenagers?",
        options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"],
        correct: 2
      }
    ]
  },
  2: {
    id: 2,
    title: "Road Safety Quiz",
    questions: [
      {
        id: 1,
        question: "What should you do when you see a yellow traffic light?",
        options: ["Speed up", "Stop if safe to do so", "Continue normally", "Honk the horn"],
        correct: 1
      },
      {
        id: 2,
        question: "At what age can you legally drive a car in India?",
        options: ["16 years", "17 years", "18 years", "21 years"],
        correct: 2
      },
      {
        id: 3,
        question: "What is the most important safety gear for motorcycle riders?",
        options: ["Gloves", "Jacket", "Helmet", "Boots"],
        correct: 2
      }
    ]
  },
  3: {
    id: 3,
    title: "HIV Awareness Quiz",
    questions: [
      {
        id: 1,
        question: "HIV can be transmitted through:",
        options: ["Hugging", "Sharing food", "Blood transfusion", "Mosquito bites"],
        correct: 2
      },
      {
        id: 2,
        question: "What does HIV stand for?",
        options: ["Human Immune Virus", "Human Immunodeficiency Virus", "Human Infection Virus", "Health Immune Virus"],
        correct: 1
      },
      {
        id: 3,
        question: "The best way to prevent HIV is:",
        options: ["Avoiding public places", "Using protection", "Taking vitamins", "Exercising regularly"],
        correct: 1
      }
    ]
  }
};

const helplines = [
  {
    title: "National Helpline for Mental Health",
    number: "14416",
    description: "24/7 support for mental health issues"
  },
  {
    title: "Child Helpline",
    number: "1098",
    description: "Emergency helpline for children in distress"
  },
  {
    title: "Women Helpline",
    number: "1091",
    description: "Support for women in emergency situations"
  },
  {
    title: "HIV/AIDS Helpline",
    number: "1097",
    description: "Information and support for HIV/AIDS related queries"
  }
];

// API Routes
app.get('/api/modules', (req, res) => {
  res.json(modules);
});

app.get('/api/modules/:id', (req, res) => {
  const module = modules.find(m => m.id === parseInt(req.params.id));
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  res.json(module);
});

app.get('/api/quiz/:id', (req, res) => {
  const quiz = quizzes[req.params.id];
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(quiz);
});

app.post('/api/quiz/:id/submit', (req, res) => {
  const { answers } = req.body;
  const quiz = quizzes[req.params.id];
  
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  let score = 0;
  const results = quiz.questions.map((question, index) => {
    const correct = question.correct === answers[index];
    if (correct) score++;
    return {
      questionId: question.id,
      correct,
      correctAnswer: question.options[question.correct]
    };
  });

  const percentage = Math.round((score / quiz.questions.length) * 100);
  const passed = percentage >= 70;

  res.json({
    score,
    total: quiz.questions.length,
    percentage,
    passed,
    results,
    certificateId: passed ? `CERT-${Date.now()}-${req.params.id}` : null
  });
});

app.get('/api/helplines', (req, res) => {
  res.json(helplines);
});

app.get('/api/certificate/:id', (req, res) => {
  // Simple certificate generation
  const certificateId = req.params.id;
  const [, timestamp, moduleId] = certificateId.split('-');
  const module = modules.find(m => m.id === parseInt(moduleId));
  
  if (!module) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  const date = new Date(parseInt(timestamp));
  
  res.json({
    certificateId,
    moduleName: module.title,
    date: date.toDateString(),
    studentName: "Student", // In real app, this would come from authentication
    organization: "Government of Karnataka & UNICEF"
  });
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`School Health & Wellness Website running on port ${PORT}`);
});