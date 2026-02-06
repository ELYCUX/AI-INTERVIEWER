let mediaRecorder;
let chunks = [];
let timerInterval;
let startTime;
let sessionCount = 0;
let totalConfidence = 0;




// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const video = document.getElementById('webcam');
const dashboard = document.getElementById('dashboard');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.querySelector('.status-text');
const recIndicator = document.getElementById('recIndicator');
const timer = document.getElementById('timer');
const sessionCountEl = document.getElementById('sessionCount');
const avgConfidenceEl = document.getElementById('avgConfidence');
const confScore = document.getElementById('confScore');
const scoreProgress = document.querySelector('.score-progress');

// Metric bars
const eyeBar = document.getElementById('eyeBar');
const faceBar = document.getElementById('faceBar');
const speechBar = document.getElementById('speechBar');

// Initialize Camera
function initCamera() {
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user" 
        }, 
        audio: true 
    })
    .then(stream => {
        video.srcObject = stream;
        mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm;codecs=vp9,opus' 
        });
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = uploadVideo;
        
        // Add visual feedback when camera is active
        video.onloadeddata = () => {
            video.classList.add('camera-active');
            updateStatus('ready', 'Camera Ready');
        };
    })
    .catch(err => {
        console.error('Camera Error:', err);
        updateStatus('error', 'Camera Access Denied');
        alert('Please allow camera and microphone access to use the AI Coach.');
    });
}

// Update status with animation
function updateStatus(state, message) {
    const pulse = document.querySelector('.pulse');
    statusText.textContent = message;
    
    switch(state) {
        case 'ready':
            pulse.style.background = '#10b981';
            statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
            statusIndicator.style.borderColor = '#10b981';
            break;
        case 'recording':
            pulse.style.background = '#ef4444';
            statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
            statusIndicator.style.borderColor = '#ef4444';
            break;
        case 'analyzing':
            pulse.style.background = '#f59e0b';
            statusIndicator.style.background = 'rgba(245, 158, 11, 0.1)';
            statusIndicator.style.borderColor = '#f59e0b';
            pulse.style.animation = 'pulse 1s infinite';
            break;
        case 'error':
            pulse.style.background = '#ef4444';
            statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
            statusIndicator.style.borderColor = '#ef4444';
            pulse.style.animation = 'none';
            break;
    }
}

// Start timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Stop timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Reset timer
function resetTimer() {
    stopTimer();
    timer.textContent = '00:00';
}

// Start recording
startBtn.onclick = () => {
    chunks = [];
    
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start();
        
        // UI Updates
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resetBtn.disabled = true;
        
        updateStatus('recording', 'Recording...');
        recIndicator.classList.remove('hidden');
        startTimer();
        
        // Animate webcam frame
        document.querySelector('.webcam-frame').style.borderColor = '#ef4444';
        
        // Hide dashboard with animation
        dashboard.style.opacity = '0';
        setTimeout(() => {
            dashboard.classList.add('hidden');
        }, 300);
    }
};

// Stop recording
stopBtn.onclick = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        
        // UI Updates
        startBtn.disabled = true;
        stopBtn.disabled = true;
        resetBtn.disabled = false;
        
        updateStatus('analyzing', 'Analyzing...');
        recIndicator.classList.add('hidden');
        stopTimer();
        
        // Reset webcam frame border
        document.querySelector('.webcam-frame').style.borderColor = '#334155';
    }
};

// Reset session
resetBtn.onclick = () => {
    resetTimer();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resetBtn.disabled = true;
    
    updateStatus('ready', 'Ready for New Session');
    
    // Reset dashboard
    dashboard.classList.add('hidden');
    dashboard.style.opacity = '0';
    
    // Reset metric values
    document.getElementById('eyeContactText').textContent = '--';
    document.getElementById('facialText').textContent = '--';
    document.getElementById('speakingText').textContent = '--';
    document.getElementById('transcriptText').textContent = 'Your transcript will appear here after recording...';
    
    // Reset progress bars
    eyeBar.style.width = '0%';
    faceBar.style.width = '0%';
    speechBar.style.width = '0%';
    
    // Reset tips
    const tipsList = document.getElementById('tipsList');
    tipsList.innerHTML = '<li class="tip-placeholder">Complete a recording session to receive personalized feedback</li>';
    
    // Reset score circle
    scoreProgress.style.strokeDashoffset = '339';
    confScore.textContent = '0%';
};

// Upload video and get analysis
async function uploadVideo() {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', blob, 'interview.webm');

    try {
        // Show loading animation
        dashboard.classList.remove('hidden');
        setTimeout(() => {
            dashboard.style.opacity = '1';
        }, 50);
        
        const response = await fetch('/analyze', { 
            method: 'POST', 
            body: formData 
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Update session stats
        sessionCount++;
        totalConfidence += parseInt(data.confidence_score) || 0;
        sessionCountEl.textContent = sessionCount;
        avgConfidenceEl.textContent = Math.round(totalConfidence / sessionCount) + '%';
        
        // Render dashboard with animation
        renderDashboard(data);
        
    } catch (err) {
        console.error('Upload Error:', err);
        updateStatus('error', 'Analysis Failed');
        
        // Show error in dashboard
        dashboard.classList.remove('hidden');
        dashboard.style.opacity = '1';
        
        document.getElementById('confScore').textContent = 'Error';
        document.getElementById('transcriptText').textContent = 'Failed to analyze recording. Please try again.';
        
        const tipsList = document.getElementById('tipsList');
        tipsList.innerHTML = '<li>There was an error processing your video. Please check your connection and try again.</li>';
        
        // Enable buttons
        startBtn.disabled = false;
        stopBtn.disabled = true;
        resetBtn.disabled = false;
    }
}

// Render dashboard with animations
function renderDashboard(data) {
    // Update status
    updateStatus('ready', 'Analysis Complete');
    
    // Enable reset button
    resetBtn.disabled = false;
    
    // Update confidence score with animation
    const confidence = parseInt(data.confidence_score) || 0;
    const circumference = 339; // 2 * π * 54
    const offset = circumference - (confidence / 100) * circumference;
    
    // Animate score circle
    setTimeout(() => {
        scoreProgress.style.strokeDashoffset = offset;
        animateValue(confScore, 0, confidence, 1000);
    }, 300);
    
    // Update metrics with animation
    setTimeout(() => {
        document.getElementById('eyeContactText').textContent = data.eye_contact || '--';
        document.getElementById('facialText').textContent = data.facial_expressions || '--';
        document.getElementById('speakingText').textContent = data.speaking_style || '--';
        document.getElementById('transcriptText').textContent = data.transcript || 'No transcript available';
        
        // Animate progress bars based on metrics
        animateProgressBar(eyeBar, getMetricScore(data.eye_contact));
        animateProgressBar(faceBar, getMetricScore(data.facial_expressions));
        animateProgressBar(speechBar, getMetricScore(data.speaking_style));
        
        // Update tips
        const tipsList = document.getElementById('tipsList');
        if (data.feedback_points && data.feedback_points.length > 0) {
            tipsList.innerHTML = '';
            data.feedback_points.forEach((tip, index) => {
                const li = document.createElement('li');
                li.textContent = tip;
                li.style.animationDelay = `${index * 100}ms`;
                li.classList.add('fade-in');
                tipsList.appendChild(li);
            });
        } else {
            tipsList.innerHTML = '<li>No specific feedback available. Try speaking more clearly and maintaining eye contact.</li>';
        }
        
        // Add fade-in animation to cards
        document.querySelectorAll('.card-hover').forEach((card, index) => {
            card.style.animationDelay = `${index * 100}ms`;
            card.classList.add('fade-in');
        });
        
    }, 500);
}

// Helper function to animate numeric values
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + '%';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Helper function to animate progress bars
function animateProgressBar(barElement, percentage) {
    setTimeout(() => {
        barElement.style.width = percentage + '%';
    }, 300);
}

// Helper function to convert metric text to percentage
function getMetricScore(metric) {
    if (!metric) return 0;
    
    metric = metric.toLowerCase();
    if (metric.includes('excellent') || metric.includes('good') || metric.includes('strong')) {
        return 80 + Math.random() * 15; // 80-95%
    } else if (metric.includes('average') || metric.includes('moderate') || metric.includes('adequate')) {
        return 60 + Math.random() * 15; // 60-75%
    } else if (metric.includes('needs improvement') || metric.includes('poor') || metric.includes('weak')) {
        return 30 + Math.random() * 20; // 30-50%
    }
    return 50; // Default
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    initCamera();
    
    // Add CSS for fade-in animation
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            animation: fadeInUp 0.5s ease forwards;
            opacity: 0;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .camera-active {
            animation: cameraPulse 3s infinite;
        }
        
        @keyframes cameraPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
    `;
    document.head.appendChild(style);
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && mediaRecorder && mediaRecorder.state === 'recording') {
        stopBtn.click(); // Stop recording if user switches tabs
    }
});
// Add these to your DOM Elements section
const fetchQBtn = document.getElementById('fetchQBtn');
const roleSelect = document.getElementById('roleSelect');
const currentQuestionText = document.getElementById('currentQuestionText');

// Function to fetch questions from the Flask backend
fetchQBtn.onclick = async () => {
    const role = roleSelect.value;
    updateStatus('analyzing', 'Fetching...');
    
    try {
        const response = await fetch(`/get_questions?role=${encodeURIComponent(role)}`);
        const questions = await response.json();
        
        // Randomly pick one of the 3 questions returned by Gemini
        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        currentQuestionText.textContent = randomQ;
        updateStatus('ready', 'Question Loaded');
    } catch (err) {
        currentQuestionText.textContent = "Error loading question. Please try again.";
        updateStatus('error', 'Fetch Failed');
    }
};

// Modify your uploadVideo() function to send the question to the backend
// Inside uploadVideo(), change the formData part:
const formData = new FormData();
formData.append('video', blob, 'interview.webm');
formData.append('question', currentQuestionText.textContent); // <--- Add this line


