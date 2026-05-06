const API_URL = '/api';

async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            if(!window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
                window.location.href = 'login.html';
            }
            return;
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch API Error:", error);
        alert(error.message || "There was an error communicating with the server.");
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const toggleBtns = document.querySelectorAll('#theme-toggle i');
    toggleBtns.forEach(icon => {
        if (theme === 'light') {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    });
}

// Call init on load
initTheme();
