// Application State
let currentSection = 'home';
let modules = [];
let helplines = [];

// DOM Elements
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('.nav-btn');
const moduleModal = document.getElementById('module-modal');
const quizModal = document.getElementById('quiz-modal');
const loading = document.getElementById('loading');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadModules();
    loadHelplines();
    setupModals();
});

// Navigation
function initializeNavigation() {
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

function switchSection(sectionName) {
    // Update active section
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    // Update active nav button
    navButtons.forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-section') === sectionName) {
            button.classList.add('active');
        }
    });
    
    currentSection = sectionName;
}

// Utility Functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

async function fetchAPI(url, options = {}) {
    try {
        showLoading();
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert('An error occurred while loading data. Please try again.');
        return null;
    } finally {
        hideLoading();
    }
}

// Load Modules
async function loadModules() {
    const data = await fetchAPI('/api/modules');
    if (data) {
        modules = data;
        renderModules();
    }
}

function renderModules() {
    const modulesGrid = document.getElementById('modules-grid');
    
    modulesGrid.innerHTML = modules.map(module => `
        <div class="module-card" onclick="openModule(${module.id})">
            <div class="module-header">
                <h3>${module.title}</h3>
            </div>
            <div class="module-content">
                <p>${module.description}</p>
                <button class="btn" onclick="event.stopPropagation(); openModule(${module.id})">
                    <i class="fas fa-play"></i> Start Learning
                </button>
                <button class="btn btn-secondary" onclick="event.stopPropagation(); startQuiz(${module.quizId})">
                    <i class="fas fa-question-circle"></i> Take Quiz
                </button>
            </div>
        </div>
    `).join('');
}

// Load Helplines
async function loadHelplines() {
    const data = await fetchAPI('/api/helplines');
    if (data) {
        helplines = data;
        renderHelplines();
    }
}

function renderHelplines() {
    const helplinesGrid = document.getElementById('helplines-grid');
    
    helplinesGrid.innerHTML = helplines.map(helpline => `
        <div class="helpline-card">
            <div class="helpline-number">
                <i class="fas fa-phone"></i> ${helpline.number}
            </div>
            <h3>${helpline.title}</h3>
            <p>${helpline.description}</p>
            <button class="btn" onclick="callHelpline('${helpline.number}')">
                <i class="fas fa-phone-alt"></i> Call Now
            </button>
        </div>
    `).join('');
}

// Module Functions
async function openModule(moduleId) {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const modalContent = document.getElementById('module-content');
    modalContent.innerHTML = `
        <h2>${module.title}</h2>
        <div class="video-container">
            <div class="video-placeholder">
                <i class="fas fa-play-circle"></i>
                <h3>Educational Video</h3>
                <p>Video content for ${module.title} would be displayed here</p>
                <p><em>Note: In a production environment, this would show the actual video player</em></p>
            </div>
        </div>
        <div class="module-details">
            <h3>About This Module</h3>
            <p>${module.description}</p>
            
            <h3>Resources</h3>
            <ul>
                ${module.resources.map(resource => `<li>${resource}</li>`).join('')}
            </ul>
            
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn" onclick="startQuiz(${module.quizId})">
                    <i class="fas fa-graduation-cap"></i> Take Quiz & Earn Certificate
                </button>
            </div>
        </div>
    `;
    
    moduleModal.style.display = 'block';
}

// Quiz Functions
async function startQuiz(quizId) {
    closeModal(moduleModal);
    
    const quizData = await fetchAPI(`/api/quiz/${quizId}`);
    if (!quizData) return;
    
    const modalContent = document.getElementById('quiz-content');
    modalContent.innerHTML = `
        <h2>${quizData.title}</h2>
        <form id="quiz-form">
            ${quizData.questions.map((question, index) => `
                <div class="question">
                    <h3>Question ${index + 1}: ${question.question}</h3>
                    <div class="options">
                        ${question.options.map((option, optionIndex) => `
                            <label class="option" onclick="selectOption(this)">
                                <input type="radio" name="question-${index}" value="${optionIndex}" style="display: none;">
                                ${option}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            <div style="text-align: center; margin-top: 2rem;">
                <button type="button" class="btn" onclick="submitQuiz(${quizId})">
                    <i class="fas fa-paper-plane"></i> Submit Quiz
                </button>
            </div>
        </form>
    `;
    
    quizModal.style.display = 'block';
}

function selectOption(element) {
    // Clear other selections in the same question
    const questionDiv = element.closest('.question');
    questionDiv.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Select this option
    element.classList.add('selected');
    element.querySelector('input').checked = true;
}

async function submitQuiz(quizId) {
    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    const answers = [];
    
    // Collect answers
    for (let i = 0; i < 10; i++) { // Assume max 10 questions
        const answer = formData.get(`question-${i}`);
        if (answer !== null) {
            answers.push(parseInt(answer));
        }
    }
    
    if (answers.length === 0) {
        alert('Please answer at least one question before submitting.');
        return;
    }
    
    const result = await fetchAPI(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
    });
    
    if (result) {
        showQuizResults(result, quizId);
    }
}

function showQuizResults(result, quizId) {
    const modalContent = document.getElementById('quiz-content');
    const module = modules.find(m => m.quizId === parseInt(quizId));
    
    modalContent.innerHTML = `
        <div class="quiz-results">
            <h2>Quiz Results</h2>
            <div class="score-display ${result.passed ? '' : 'fail'}">
                ${result.score}/${result.total}
            </div>
            <h3>${result.percentage}% Score</h3>
            <p>${result.passed ? 
                'Congratulations! You passed the quiz!' : 
                'Keep learning! You need 70% to pass.'
            }</p>
            
            ${result.passed ? `
                <div class="certificate">
                    <h2><i class="fas fa-certificate"></i> Certificate of Completion</h2>
                    <p>This certifies that</p>
                    <h3>Student</h3>
                    <p>has successfully completed the</p>
                    <h3>${module ? module.title : 'Course'}</h3>
                    <div class="certificate-id">Certificate ID: ${result.certificateId}</div>
                    <p>Government of Karnataka & UNICEF</p>
                    <button class="btn" onclick="downloadCertificate('${result.certificateId}')">
                        <i class="fas fa-download"></i> Download Certificate
                    </button>
                </div>
            ` : `
                <div style="margin-top: 2rem;">
                    <button class="btn" onclick="startQuiz(${quizId})">
                        <i class="fas fa-redo"></i> Retake Quiz
                    </button>
                </div>
            `}
        </div>
    `;
}

// Certificate Functions
async function downloadCertificate(certificateId) {
    const certData = await fetchAPI(`/api/certificate/${certificateId}`);
    if (!certData) return;
    
    // In a real application, this would generate and download a PDF
    // For now, we'll show the certificate data
    alert(`Certificate Details:
    
Certificate ID: ${certData.certificateId}
Module: ${certData.moduleName}
Date: ${certData.date}
Student: ${certData.studentName}
Organization: ${certData.organization}

In a production environment, this would download a PDF certificate.`);
}

// Helpline Functions
function callHelpline(number) {
    if (confirm(`Do you want to call ${number}?`)) {
        // In a real mobile app, this would initiate a phone call
        window.open(`tel:${number}`, '_self');
    }
}

// Modal Functions
function setupModals() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Click outside to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// Utility Functions for Production Features
function downloadResource(resourceName) {
    // In production, this would download actual PDF resources
    alert(`Downloading ${resourceName}...
    
In a production environment, this would download the actual PDF resource.`);
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    hideLoading();
});

// Keyboard Navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'block') {
                closeModal(modal);
            }
        });
    }
});

// Add resource download handlers
document.addEventListener('click', function(event) {
    if (event.target.matches('.resource-card .btn')) {
        event.preventDefault();
        const resourceCard = event.target.closest('.resource-card');
        const resourceName = resourceCard.querySelector('h3').textContent;
        downloadResource(resourceName);
    }
});

console.log('School Health & Wellness Hub - Application Loaded Successfully!');