const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');

// Login Elements
const loginWrapper = document.getElementById('login-wrapper');
const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app-container');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const toggleAuthMode = document.getElementById('toggle-auth-mode');
const loginHeader = document.getElementById('login-header');
const loginSubtext = document.getElementById('login-subtext');
const loginError = document.getElementById('login-error');

// Profile Elements
const userAvatarInitials = document.getElementById('user-avatar-initials');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');
const googleBtn = document.getElementById('google-btn');

let isSignupMode = false;
let currentUserEmail = null;

async function loadUserHistory(email) {
    try {
        const localHistory = JSON.parse(localStorage.getItem(`nexus_history_${email}`)) || [];
        chatHistory = [];
        historyList.innerHTML = '';
        // Load them sequentially
        localHistory.forEach(item => {
            addToHistory(item.prompt, true);
        });
    } catch (e) {
        console.error("Could not load history from local storage");
    }
}

// Handle toggle between Login and Sign Up
toggleAuthMode.addEventListener('click', () => {
    isSignupMode = !isSignupMode;
    loginError.style.display = 'none'; // Clear error on toggle
    if (isSignupMode) {
        loginHeader.innerText = "Create an account";
        loginSubtext.innerText = "Sign up to start chatting with Nexus";
        loginBtn.innerText = "Sign up";
        document.getElementById('login-footer-text').innerHTML = 'Already have an account? <span id="toggle-auth-mode">Log in</span>';
    } else {
        loginHeader.innerText = "Welcome back";
        loginSubtext.innerText = "Log in with your Nexus account to continue";
        loginBtn.innerText = "Continue";
        document.getElementById('login-footer-text').innerHTML = "Don't have an account? <span id='toggle-auth-mode'>Sign up</span>";
    }
    // Reattach listener to the newly rendered span
    document.getElementById('toggle-auth-mode').addEventListener('click', () => toggleAuthMode.click());
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginBtn.innerText = "Processing...";

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    setTimeout(async () => {
        let success = false;
        let errorMessage = "";

        // Read LocalStorage Database
        const usersDB = JSON.parse(localStorage.getItem('nexus_users')) || {};

        if (isSignupMode) {
            if (usersDB[email]) {
                errorMessage = "Email already exists.";
            } else {
                usersDB[email] = { password: password };
                localStorage.setItem('nexus_users', JSON.stringify(usersDB));
                success = true;
            }
        } else {
            if (!usersDB[email]) {
                errorMessage = "User not found.";
            } else if (usersDB[email].password !== password) {
                errorMessage = "Incorrect password.";
            } else {
                success = true;
            }
        }

        if (success) {
            // Populate user profile in sidebar
            userEmailDisplay.innerText = email;
            userAvatarInitials.innerText = email.charAt(0).toUpperCase();
            userAvatarInitials.style.background = ""; // clear possible Google override
            userAvatarInitials.style.color = "var(--text-primary)";

            currentUserEmail = email;
            await loadUserHistory(email);

            loginError.style.display = 'none';
            loginWrapper.style.display = 'none';
            appContainer.style.display = 'flex';
            userInput.focus();
        } else {
            loginError.innerText = errorMessage;
            loginError.style.display = 'block';
            loginBtn.innerText = isSignupMode ? "Sign up" : "Continue";
        }
    }, 400); // Small artificial delay to look authentic
});

// Mock Google Auth logic
googleBtn.addEventListener('click', () => {
    loginError.style.display = 'none';

    // Simulate real OAuth flow by opening Google's sign-in page in a popup
    const authWindow = window.open(
        'https://accounts.google.com/signin/v2/identifier',
        'Google Login',
        'width=500,height=600,left=' + (window.innerWidth / 2 - 250) + ',top=' + (window.innerHeight / 2 - 300)
    );

    // Wait a few seconds to let them "log in", then auto-close the popup to simulate returning
    setTimeout(() => {
        if (authWindow && !authWindow.closed) {
            authWindow.close();

            // Proceed to mock log them in after "successful" popup Auth
            const email = "user@google.com";

            userEmailDisplay.innerText = email;
            userAvatarInitials.innerText = "G";
            userAvatarInitials.style.background = "#4285F4"; // Google Blue
            userAvatarInitials.style.color = "white";

            currentUserEmail = email;
            loadUserHistory(email);

            loginWrapper.style.display = 'none';
            appContainer.style.display = 'flex';
            userInput.focus();
        }
    }, 5000); // 5-second simulated login duration
});

// Logout Event Listener
logoutBtn.addEventListener('click', () => {
    // Reset App state
    appContainer.style.display = 'none';
    loginWrapper.style.display = 'flex';

    // Clear credentials
    currentUserEmail = null;
    chatHistory = [];
    historyList.innerHTML = '';

    loginEmail.value = '';
    loginPassword.value = '';
    loginError.style.display = 'none';
    loginBtn.innerText = "Continue";

    // Auto click New Chat to wipe screen for security
    newChatBtn.click();
});

let chatHistory = [];

const responses = {
    greetings: {
        keywords: ["hello", "hi", "hey", "hola", "greetings"],
        reply: "Hello! I'm Nexus. How can I assist you today?"
    },
    tasks: {
        keywords: ["task", "do for me", "capabilities", "real time tasks", "what can you do"],
        reply: "I can assist with various professional tasks: <br><br>• 🗓️ Scheduling simulations<br>• 🥗 Diet & Wellness planning<br>• 🔢 Real-time calculations<br>• ✍️ Content drafting<br>Just let me know what you need!"
    },
    diet: {
        keywords: ["diet", "meal plan", "nutrition", "eat"],
        reply: "I've drafted a balanced wellness plan for you:<br>• <b>Breakfast</b>: Greek yogurt with honey and almonds.<br>• <b>Lunch</b>: Grilled chicken salad with quinoa.<br>• <b>Dinner</b>: Steamed salmon with asparagus and brown rice.<br>• <b>Snack</b>: Fresh berries or a handful of walnuts."
    },
    gratitude: {
        keywords: ["thanks", "thank you", "thx"],
        reply: "Task complete! Always happy to exceed your expectations."
    },
    help: {
        keywords: ["help", "how to"],
        reply: "I'm designed to be your productivity partner. Try asking me to 'provide a diet plan', 'calculate 15% of 250', or 'check my schedule'."
    }
};

const defaultResponse = "I'm analyzing your request. Could you provide more specific details so I can generate the most useful output for you?";

function addMessage(text, sender, isBotAnimate = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('message-content-wrapper');

    messageDiv.appendChild(contentWrapper);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (!isBotAnimate) {
        contentWrapper.innerHTML = text;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return Promise.resolve();
    }

    // Line-by-line / Character streaming effect
    return new Promise(resolve => {
        let i = 0;
        let isTag = false;
        let currentText = '';

        function type() {
            if (i < text.length) {
                let char = text.charAt(i);
                currentText += char;

                // Fast-forward through HTML tags so DOM isn't broken
                if (char === '<') isTag = true;
                if (char === '>') isTag = false;

                i++;
                if (isTag) {
                    type();
                } else {
                    contentWrapper.innerHTML = currentText;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    // Slightly randomize typing speed for natural feel
                    setTimeout(type, 10 + Math.random() * 15);
                }
            } else {
                resolve();
            }
        }
        type();
    });
}

function showTyping() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

function addToHistory(message, isInit = false) {
    if (chatHistory.length === 0) {
        historyList.innerHTML = ''; // clear placeholder text if any
    }

    chatHistory.unshift(message);

    // AI Logic to determine a short, readable title from the user prompt
    let title = message;

    // Remove fluff words
    const stopWords = ['can', 'you', 'give', 'me', 'a', 'an', 'what', 'is', 'the', 'tell', 'about', 'how', 'to', 'do'];
    let words = message.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');

    let filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 2);

    if (filteredWords.length > 0) {
        // Take up to the first 3 meaningful words
        title = filteredWords.slice(0, 3).join(' ');
        // Capitalize First Letters
        title = title.replace(/\b\w/g, char => char.toUpperCase());
    } else {
        // Fallback title formatting if it was just stop words or very short
        title = message.charAt(0).toUpperCase() + message.slice(1);
    }

    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');
    historyItem.innerText = title;
    historyItem.title = message; // Keep original prompt as a tooltip on hover

    // Add to top visually
    historyList.prepend(historyItem);

    // Auto-select latest
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
    historyItem.classList.add('active');

    // Save to local storage if it's a new entry and user is logged in
    if (!isInit && currentUserEmail) {
        const userHistoryKey = `nexus_history_${currentUserEmail}`;
        const currentLocalHistory = JSON.parse(localStorage.getItem(userHistoryKey)) || [];
        // Push the new message logic to bottom of array, so it loads sequentially
        currentLocalHistory.push({ title: title, prompt: message, timestamp: Date.now() });
        localStorage.setItem(userHistoryKey, JSON.stringify(currentLocalHistory));
    }
}

newChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = `
                <div class="message bot">
                    <div class="message-content-wrapper">Hello! I'm Nexus. How can I assist you today?</div>
                </div>
            `;
    userInput.value = '';
    userInput.focus();
    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
});

async function getBotResponse(input) {
    const cleanInput = input.toLowerCase().trim();

    // 1. Check for Math Tasks
    if (cleanInput.includes('calculate') || (/\d+[\+\-\*\/]\d+/).test(cleanInput)) {
        try {
            // Basic math extraction
            const expression = cleanInput.replace(/[a-zA-Z?]/g, '').trim();
            if (expression) {
                const result = eval(expression);
                return `Calculation Complete: The result of <b>${expression}</b> is <b>${result}</b>.`;
            }
        } catch (e) {
            return "I couldn't process that calculation. Could you verify the numbers?";
        }
    }

    // 2. Check for Schedule Tasks
    if (cleanInput.includes('schedule') || cleanInput.includes('calendar')) {
        return "I've reviewed your virtual agenda:<br>• 09:00 AM: Focus Session<br>• 01:30 PM: Client Consultation<br>• 04:00 PM: Project Review";
    }

    // 3. Check for Real-Time Knowledge Base (Open AI API Integration)
    const qaMatch = cleanInput.match(/^(what is|who is|tell me about|what are|who are|explain) (.*)/i);
    if (qaMatch && qaMatch[2]) {
        try {
            // Asking a free AI generation API for the full answer directly
            const prompt = `Please provide a concise and helpful answer to this question: ${cleanInput}`;
            const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;

            const res = await fetch(url);
            let aiText = await res.text();

            // Format the AI's markdown response properly using marked.js
            aiText = marked.parse(aiText);

            return `<div class="ai-card">
                      <div class="ai-card-header"><i class="fas fa-brain"></i> Nexus Intelligence</div>
                      <div class="ai-card-body" style="font-size: 14px;">${aiText}</div>
                    </div>`;
        } catch (e) {
            console.error("API Fetch Error:", e);
            return "I'm having trouble tapping into my neural network right now.";
        }
    }

    // 4. Check for Live Weather
    const weatherMatch = cleanInput.match(/weather (in|for) (.*)/i);
    if (weatherMatch && weatherMatch[2]) {
        const city = weatherMatch[2].replace(/\?$/, '').trim();
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
                const loc = geoData.results[0];
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`);
                const weatherData = await weatherRes.json();
                const temp = weatherData.current_weather.temperature;
                return `<div class="ai-card">
                          <div class="ai-card-header"><i class="fas fa-cloud-sun"></i> Live Weather Check</div>
                          <div class="ai-card-body">The current temperature in <b>${loc.name}, ${loc.country}</b> is <b>${temp}°C</b>.</div>
                        </div>`;
            } else {
                return `I couldn't locate the city "${city}" to check the weather.`;
            }
        } catch (e) {
            return "Unable to fetch live weather data right now.";
        }
    }

    // 5. Check for keyword matches in groups using word boundaries
    for (let category in responses) {
        const group = responses[category];
        if (group.keywords.some(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            return regex.test(cleanInput);
        })) {
            return group.reply;
        }
    }

    // Default Fallback: Ask the AI
    try {
        const prompt = `Please provide a concise and helpful answer to this: ${input}`;
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;

        const res = await fetch(url);
        let aiText = await res.text();

        aiText = marked.parse(aiText);

        return `<div class="ai-card" style="border-left: 3px solid #7c3aed;">
                  <div class="ai-card-body" style="font-size: 14px; margin-bottom: 0;">${aiText}</div>
                </div>`;
    } catch (e) {
        return defaultResponse;
    }
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = userInput.value.trim();

    if (message) {
        // User message
        addMessage(message, 'user');
        addToHistory(message);
        userInput.value = '';

        // Bot reaction
        showTyping();

        // Simulate thinking time
        setTimeout(async () => {
            const response = await getBotResponse(message);
            hideTyping();
            await addMessage(response, 'bot', true);
        }, 800 + Math.random() * 800); // Networking / thinking delay
    }
});

// Focus input on load
window.onload = () => userInput.focus();
