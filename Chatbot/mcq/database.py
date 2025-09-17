import sqlite3
import json
from typing import Optional, List
from datetime import datetime
from .models import MCQItem, Difficulty, AttemptRequest
import uuid

class MCQDatabase:
    def __init__(self, db_path: str = "mcq_database.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                topic TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                question TEXT NOT NULL,
                options TEXT NOT NULL,
                explanation TEXT NOT NULL,
                distractor_rationale TEXT NOT NULL,
                source TEXT NOT NULL,
                confidence REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Create attempts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attempts (
                id TEXT PRIMARY KEY,
                question_id TEXT NOT NULL,
                selected TEXT NOT NULL,
                correct BOOLEAN NOT NULL,
                user_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id)')
        
        conn.commit()
        conn.close()

    def store_question(self, mcq_item: MCQItem) -> bool:
        """Store a single MCQ question in the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if question already exists
            cursor.execute('SELECT id FROM questions WHERE question = ?', (mcq_item.question,))
            if cursor.fetchone():
                conn.close()
                return False  # Question already exists
            
            cursor.execute('''
                INSERT INTO questions 
                (id, topic, difficulty, question, options, explanation, distractor_rationale, source, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                mcq_item.id,
                mcq_item.topic,
                mcq_item.difficulty.value,
                mcq_item.question,
                json.dumps([option.dict() for option in mcq_item.options]),
                mcq_item.explanation,
                json.dumps(mcq_item.distractor_rationale),
                mcq_item.source,
                mcq_item.estimated_confidence
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error storing question: {e}")
            if 'conn' in locals():
                conn.close()
            return False

    def get_next_question(self, topic: Optional[str] = None, difficulty: Optional[Difficulty] = None) -> Optional[MCQItem]:
        """Get the next question for the given topic and difficulty"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = 'SELECT * FROM questions WHERE 1=1'
            params = []
            
            if topic:
                query += ' AND topic = ?'
                params.append(topic)
            
            if difficulty:
                query += ' AND difficulty = ?'
                params.append(difficulty.value)
            
            query += ' ORDER BY created_at DESC LIMIT 1'
            
            cursor.execute(query, params)
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            # Convert row to MCQItem
            options_data = json.loads(row[4])
            return MCQItem(
                id=row[0],
                topic=row[1],
                difficulty=Difficulty(row[2]),
                question=row[3],
                options=options_data,
                explanation=row[5],
                distractor_rationale=json.loads(row[6]),
                source=row[7],
                estimated_confidence=row[8]
            )
        except Exception as e:
            print(f"Error getting next question: {e}")
            return None

    def record_attempt(self, attempt: AttemptRequest, correct: bool) -> bool:
        """Record a user's attempt at answering a question"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO attempts (id, question_id, selected, correct, user_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                attempt.question_id,
                attempt.selected,
                correct,
                attempt.user_id
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error recording attempt: {e}")
            if 'conn' in locals():
                conn.close()
            return False

    def get_question_by_id(self, question_id: str) -> Optional[MCQItem]:
        """Get a specific question by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM questions WHERE id = ?', (question_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            options_data = json.loads(row[4])
            return MCQItem(
                id=row[0],
                topic=row[1],
                difficulty=Difficulty(row[2]),
                question=row[3],
                options=options_data,
                explanation=row[5],
                distractor_rationale=json.loads(row[6]),
                source=row[7],
                estimated_confidence=row[8]
            )
        except Exception as e:
            print(f"Error getting question by ID: {e}")
            return None

    def get_analytics(self, topic: Optional[str] = None) -> dict:
        """Get basic analytics for questions and attempts"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Total questions by topic
            query = '''
                SELECT topic, difficulty, COUNT(*) as count
                FROM questions
                GROUP BY topic, difficulty
            '''
            cursor.execute(query)
            questions_stats = cursor.fetchall()
            
            # Attempt statistics
            query = '''
                SELECT q.topic, a.correct, COUNT(*) as count
                FROM attempts a
                JOIN questions q ON a.question_id = q.id
                GROUP BY q.topic, a.correct
            '''
            cursor.execute(query)
            attempt_stats = cursor.fetchall()
            
            conn.close()
            
            return {
                "questions_by_topic": questions_stats,
                "attempt_stats": attempt_stats
            }
        except Exception as e:
            print(f"Error getting analytics: {e}")
            return {}