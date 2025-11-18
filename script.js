
document.addEventListener('DOMContentLoaded', () => {
    // Initialize voice recognition
    const voiceInput = document.querySelector('custom-voice-input');
    
    // Form submission handler
    const form = document.getElementById('symptoms-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i data-feather="loader" class="animate-spin mr-2"></i> Analyzing...`;
            feather.replace();
            
            // Collect form data
            const formData = {
                symptoms: document.getElementById('symptoms-input').value,
                age: document.getElementById('age').value,
                gender: document.getElementById('gender').value,
                location: document.getElementById('location').value,
                duration: document.getElementById('duration').value
            };
            
            try {
                // In production: Send to /triage API
                // const response = await fetch('/triage', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });
                // const result = await response.json();
                
                // Simulate API response
                const result = {
                    risk_scores: {
                        malaria: Math.random(),
                        diabetes: Math.random() * 0.5,
                        respiratory_infection: Math.random() * 0.7
                    },
                    explanation: "Based on your symptoms, the highest risk appears to be malaria. Please consult a healthcare provider for proper diagnosis."
                };
                
                // Store in session for results page
                sessionStorage.setItem('healthAssessment', JSON.stringify(result));
                window.location.href = 'results.html';
                
                // In production: Log to blockchain
                // await logToBlockchain(result);
                
            } catch (error) {
                showToast('Error submitting assessment. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Check My Health Risk`;
                feather.replace();
            }
        });
    }
    
    // Display results if coming from form
    if (window.location.pathname.includes('results.html')) {
        displayResults();
    }
    
    // Offline detection
    window.addEventListener('offline', () => {
        showToast('You are offline. Some features may be limited.', 'warning');
    });
    
    window.addEventListener('online', () => {
        showToast('Connection restored!', 'success');
    });
});

async function logToBlockchain(data) {
    // Generate anonymous user ID hash
    const anonId = await sha256(navigator.userAgent + Date.now());
    const logData = {
        screening_id_hash: await sha256(JSON.stringify(data)),
        risk_summary: {
            malaria: data.risk_scores.malaria > 0.5,
            diabetes: data.risk_scores.diabetes > 0.5,
            respiratory: data.risk_scores.respiratory_infection > 0.5
        },
        timestamp: new Date().toISOString(),
        anon_user_id: anonId
    };
    
    // In production: Send to /log-screening API
    console.log('Would log to blockchain:', logData);
}

async function sha256(message) {
    // Hash function for anonymization
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function displayResults() {
    const result = JSON.parse(sessionStorage.getItem('healthAssessment'));
    if (!result) {
        window.location.href = 'index.html';
        return;
    }
    
    // Format percentages
    const malariaPercent = Math.round(result.risk_scores.malaria * 100);
    const diabetesPercent = Math.round(result.risk_scores.diabetes * 100);
    const respPercent = Math.round(result.risk_scores.respiratory_infection * 100);
    
    // Update UI
    document.getElementById('malaria-score').textContent = `${malariaPercent}%`;
    document.getElementById('malaria-bar').style.width = `${malariaPercent}%`;
    document.getElementById('diabetes-score').textContent = `${diabetesPercent}%`;
    document.getElementById('diabetes-bar').style.width = `${diabetesPercent}%`;
    document.getElementById('respiratory-score').textContent = `${respPercent}%`;
    document.getElementById('respiratory-bar').style.width = `${respPercent}%`;
    
    document.getElementById('explanation').textContent = result.explanation;
    document.getElementById('result-date').textContent = new Date().toLocaleDateString();
}
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } shadow-lg`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}