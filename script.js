// Character Sets
const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguous: /[iIl1o0O]/g
};

// DOM Elements
const passwordInput = document.getElementById('passwordInput');
const copyBtn = document.getElementById('copyBtn');
const generateBtn = document.getElementById('generateBtn');
const lengthSlider = document.getElementById('lengthSlider');
const lengthVal = document.getElementById('lengthVal');

const includeUpper = document.getElementById('includeUpper');
const includeLower = document.getElementById('includeLower');
const includeNumbers = document.getElementById('includeNumbers');
const includeSymbols = document.getElementById('includeSymbols');
const excludeAmbiguous = document.getElementById('excludeAmbiguous');

const strengthLabel = document.getElementById('strengthLabel');
const entropyText = document.getElementById('entropyText');
const meterFill = document.getElementById('meterFill');
const crackTimeText = document.getElementById('crackTimeText');

const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyBox = document.getElementById('historyBox');
const historyList = document.getElementById('historyList');
const toast = document.getElementById('toast');

let passwordHistory = [];

// Event Listeners
lengthSlider.addEventListener('input', (e) => {
    lengthVal.textContent = e.target.value;
    generatePassword();
});

[includeUpper, includeLower, includeNumbers, includeSymbols, excludeAmbiguous].forEach(element => {
    element.addEventListener('change', generatePassword);
});

passwordInput.addEventListener('input', analyzePassword);
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);

historyToggleBtn.addEventListener('click', () => {
    historyBox.classList.toggle('hidden');
});

// Password Generator Function
function generatePassword() {
    let pool = '';
    if (includeUpper.checked) pool += CHARS.upper;
    if (includeLower.checked) pool += CHARS.lower;
    if (includeNumbers.checked) pool += CHARS.numbers;
    if (includeSymbols.checked) pool += CHARS.symbols;

    if (excludeAmbiguous.checked) {
        pool = pool.replace(CHARS.ambiguous, '');
    }

    if (!pool) {
        passwordInput.value = '';
        analyzePassword();
        return;
    }

    const length = parseInt(lengthSlider.value);
    let password = '';
    const cryptoObj = window.crypto || window.msCrypto;
    const randomValues = new Uint32Array(length);
    cryptoObj.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        password += pool[randomValues[i] % pool.length];
    }

    passwordInput.value = password;
    analyzePassword();
    addToHistory(password);
}

// Password Strength & Entropy Analyzer
function analyzePassword() {
    const pwd = passwordInput.value;
    
    // Checklist updates
    const hasLength = pwd.length >= 12;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    updateCheckItem('chk-length', hasLength);
    updateCheckItem('chk-upper', hasUpper);
    updateCheckItem('chk-lower', hasLower);
    updateCheckItem('chk-number', hasNumber);
    updateCheckItem('chk-symbol', hasSymbol);

    if (!pwd) {
        meterFill.style.width = '0%';
        strengthLabel.textContent = 'None';
        entropyText.textContent = '0 bits';
        crackTimeText.textContent = 'Instant';
        return;
    }

    // Calculate Pool Size for Entropy
    let poolSize = 0;
    if (/[a-z]/.test(pwd)) poolSize += 26;
    if (/[A-Z]/.test(pwd)) poolSize += 26;
    if (/[0-9]/.test(pwd)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) poolSize += 32;

    // Mathematical Entropy (E = L * log2(R))
    const entropy = Math.round(pwd.length * (Math.log2(poolSize || 1)));
    entropyText.textContent = `${entropy} bits`;

    // Estimate Crack Time (Assuming 10 Billion Guesses / second)
    const combinations = Math.pow(poolSize || 1, pwd.length);
    const seconds = combinations / 10000000000;
    crackTimeText.textContent = formatCrackTime(seconds);

    // Dynamic UI Ratings based on Entropy
    let strengthLevel = 0;
    let label = 'Very Weak';
    let color = 'var(--str-0)';

    if (entropy >= 80) {
        strengthLevel = 100;
        label = 'Uncrackable';
        color = 'var(--str-4)';
    } else if (entropy >= 60) {
        strengthLevel = 80;
        label = 'Strong';
        color = 'var(--str-3)';
    } else if (entropy >= 40) {
        strengthLevel = 55;
        label = 'Medium';
        color = 'var(--str-2)';
    } else if (entropy >= 25) {
        strengthLevel = 30;
        label = 'Weak';
        color = 'var(--str-1)';
    } else {
        strengthLevel = 15;
        label = 'Very Weak';
        color = 'var(--str-0)';
    }

    meterFill.style.width = `${strengthLevel}%`;
    meterFill.style.backgroundColor = color;
    strengthLabel.textContent = label;
    strengthLabel.style.color = color;
}

// Helpers
function updateCheckItem(id, isValid) {
    const el = document.getElementById(id);
    if (isValid) {
        el.classList.add('valid');
        el.querySelector('i').className = 'fa-solid fa-circle-check';
    } else {
        el.classList.remove('valid');
        el.querySelector('i').className = 'fa-solid fa-circle-xmark';
    }
}

function formatCrackTime(seconds) {
    if (seconds < 1) return 'Instant';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
    return 'Centuries';
}

function copyToClipboard() {
    if (!passwordInput.value) return;
    navigator.clipboard.writeText(passwordInput.value).then(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
}

function addToHistory(pwd) {
    if (passwordHistory.includes(pwd)) return;
    passwordHistory.unshift(pwd);
    if (passwordHistory.length > 5) passwordHistory.pop();

    historyList.innerHTML = passwordHistory
        .map(p => `<li>${p}</li>`)
        .join('');
}

// Initial Run
generatePassword();