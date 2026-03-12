document.addEventListener('DOMContentLoaded', function() {
    // === ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ===
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });

    // === ЭЛЕМЕНТЫ КОЛЕСА ===
    const wheelSVG = document.getElementById('wheel-svg');
    const wheelSectorsGroup = document.getElementById('wheel-sectors');
    const spinBtn = document.getElementById('spin-btn');
    const resultDiv = document.getElementById('result');
    const nameInput = document.getElementById('name-input');
    const addNameBtn = document.getElementById('add-name-btn');
    const clearBtn = document.getElementById('clear-btn');
    const participantsList = document.getElementById('participants-list');
    const durationInput = document.getElementById('duration-input');
    const spinSound = document.getElementById('spin-sound');
    const uploadAudioBtn = document.getElementById('upload-audio-btn');
    const audioFileInput = document.getElementById('audio-file-input');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themePanel = document.getElementById('theme-panel');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const textColorPicker = document.getElementById('text-color-picker');
    // Убрали accentColorPicker
    const resetThemeBtn = document.getElementById('reset-theme-btn');
    const countSpan = document.getElementById('count');
    const winnerLabel = document.getElementById('winner-label');
    const eliminateModeCheckbox = document.getElementById('eliminate-mode');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    let items = [];
    let stats = {};
    let currentRotation = 0;

    const uniqueColors = [
        '#4a69bd', '#6a89cc', '#82ccdd', '#78e08f',
        '#38ada9', '#e55039', '#fa8231', '#f7b731',
        '#a55eea', '#8854d0', '#0fb9b1', '#d63031'
    ];

    const CENTER_X = 300;
    const CENTER_Y = 300;
    const RADIUS = 290;

    function createSVGSector(text, index, totalItems) {
        const anglePerSector = (2 * Math.PI) / totalItems;
        const startAngle = index * anglePerSector;
        const endAngle = (index + 1) * anglePerSector;

        const x1 = CENTER_X + RADIUS * Math.cos(startAngle);
        const y1 = CENTER_Y + RADIUS * Math.sin(startAngle);
        const x2 = CENTER_X + RADIUS * Math.cos(endAngle);
        const y2 = CENTER_Y + RADIUS * Math.sin(endAngle);

        const largeArcFlag = anglePerSector > Math.PI ? 1 : 0;
        const pathData = [
            `M ${CENTER_X},${CENTER_Y}`,
            `L ${x1},${y1}`,
            `A ${RADIUS},${RADIUS} 0 ${largeArcFlag},1 ${x2},${y2}`,
            `Z`
        ].join(' ');

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", uniqueColors[index % uniqueColors.length]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("class", "sector-path");

        const textRadius = RADIUS * 0.65;
        const textAngle = startAngle + anglePerSector / 2;
        const textX = CENTER_X + textRadius * Math.cos(textAngle);
        const textY = CENTER_Y + textRadius * Math.sin(textAngle);

        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("x", textX);
        textElement.setAttribute("y", textY);
        textElement.setAttribute("class", "sector-text");

        let fontSize = 16;
        if (totalItems > 20) fontSize = Math.max(10, 18 - (totalItems - 10) * 0.4);
        textElement.setAttribute("font-size", fontSize);

        let displayText = text;
        if (totalItems > 15 && text.length > 8) {
            const maxChars = Math.max(4, 10 - Math.floor((totalItems - 15) * 0.2));
            if (text.length > maxChars) displayText = text.substring(0, maxChars - 1) + '…';
        }
        textElement.textContent = displayText;

        const sectorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        sectorGroup.appendChild(path);
        sectorGroup.appendChild(textElement);
        return sectorGroup;
    }

    function updateWheel() {
        while (wheelSectorsGroup.firstChild) wheelSectorsGroup.removeChild(wheelSectorsGroup.firstChild);
        if (items.length === 0) {
            spinBtn.disabled = true;
            countSpan.textContent = '0';
            return;
        }
        spinBtn.disabled = false;
        countSpan.textContent = items.length;
        items.forEach((item, index) => {
            wheelSectorsGroup.appendChild(createSVGSector(item, index, items.length));
        });
    }

    function updateParticipantsList() {
        participantsList.innerHTML = '';
        const totalWins = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
        items.forEach((item, index) => {
            const wins = stats[item] || 0;
            const percentage = ((wins / totalWins) * 100).toFixed(1);
            const div = document.createElement('div');
            div.className = 'participant-item';
            div.style.borderLeftColor = uniqueColors[index % uniqueColors.length];
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'participant-info';
            const nameSpan = document.createElement('div');
            nameSpan.className = 'participant-name';
            nameSpan.textContent = item;
            
            const statsDiv = document.createElement('div');
            statsDiv.className = 'participant-stats';
            const percentSpan = document.createElement('span');
            percentSpan.className = 'participant-percent';
            percentSpan.textContent = `${percentage}%`;
            const winsSpan = document.createElement('span');
            winsSpan.className = 'participant-wins';
            winsSpan.innerHTML = `<span class="wins-icon">🏆</span> ${wins}`;
            
            statsDiv.appendChild(percentSpan);
            statsDiv.appendChild(winsSpan);
            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(statsDiv);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-participant';
            deleteBtn.innerHTML = '×';
            deleteBtn.dataset.index = index;
            deleteBtn.addEventListener('click', function() {
                items.splice(parseInt(this.dataset.index), 1);
                saveData();
                updateWheel();
                updateParticipantsList();
                if (items.length === 0) {
                    resultDiv.textContent = 'Добавьте элементы...';
                    winnerLabel.textContent = 'Победитель';
                }
            });

            div.appendChild(infoDiv);
            div.appendChild(deleteBtn);
            participantsList.appendChild(div);
        });
    }

    function spinWheel() {
        if (items.length === 0) return;
        let duration = parseFloat(durationInput.value);
if (isNaN(duration) || duration < 1 || duration > 6000) {
    alert("Время от 1 до 6000 сек.");
    duration = 5;
    durationInput.value = 5;
}

        spinBtn.disabled = true;
        resultDiv.textContent = '🎡 Крутится...';
        if (spinSound.src) {
            spinSound.currentTime = 0;
            spinSound.play().catch(() => {});
        }

        const totalRotation = currentRotation + (5 + Math.floor(Math.random() * 6)) * 360 + Math.random() * 360;
        wheelSVG.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        wheelSVG.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(() => {
            const finalAngleMod = totalRotation % 360;
            const angleUnderPointer = ((270 - finalAngleMod) % 360 + 360) % 360;
            let winnerIndex = Math.floor(angleUnderPointer / (360 / items.length));
            if (winnerIndex >= items.length) winnerIndex = items.length - 1;
            
            const winner = items[winnerIndex];
            stats[winner] = (stats[winner] || 0) + 1;
            const winnerColor = uniqueColors[winnerIndex % uniqueColors.length];

            winnerLabel.textContent = `🏆 ${winner} 🏆`;
            resultDiv.innerHTML = `<span style="color:${winnerColor};font-weight:bold">${winner}</span><br><small>Побед: ${stats[winner]}</small>`;

            if (eliminateModeCheckbox.checked) {
                items.splice(winnerIndex, 1);
                currentRotation = 0;
                wheelSVG.style.transition = 'none';
                wheelSVG.style.transform = 'rotate(0deg)';
                setTimeout(() => wheelSVG.style.transition = '', 50);
            } else {
                currentRotation = totalRotation;
            }

            saveData();
            updateParticipantsList();
            updateWheel();
            spinBtn.disabled = false;
        }, duration * 1000);
    }

    function addItem() {
        const value = nameInput.value.trim();
        if (!value || items.length >= 50 || items.includes(value)) {
            if(items.length >= 50) alert("Максимум 50");
            else if(items.includes(value)) alert("Уже есть");
            return;
        }
        items.push(value);
        nameInput.value = '';
        saveData();
        updateWheel();
        updateParticipantsList();
    }

    function clearAll() {
        if (confirm('Очистить всё?')) {
            items = []; stats = {}; currentRotation = 0;
            wheelSVG.style.transform = 'rotate(0deg)';
            saveData();
            updateWheel();
            updateParticipantsList();
            resultDiv.textContent = 'Добавьте элементы...';
            winnerLabel.textContent = 'Победитель';
        }
    }

    // Глобальные переменные для монеты
    let headsCount = 0;
    let tailsCount = 0;

    function saveData() {
        localStorage.setItem('wheelItems', JSON.stringify(items));
        localStorage.setItem('wheelStats', JSON.stringify(stats));
        localStorage.setItem('eliminateMode', eliminateModeCheckbox.checked);
        localStorage.setItem('coinHeads', headsCount);
        localStorage.setItem('coinTails', tailsCount);
        // Сохраняем только фон и текст
        localStorage.setItem('bgColor', bgColorPicker.value);
        localStorage.setItem('textColor', textColorPicker.value);
    }

    function loadData() {
        const savedItems = localStorage.getItem('wheelItems');
        const savedStats = localStorage.getItem('wheelStats');
        const savedEliminate = localStorage.getItem('eliminateMode');
        const savedHeads = localStorage.getItem('coinHeads');
        const savedTails = localStorage.getItem('coinTails');
        const savedBg = localStorage.getItem('bgColor');
        const savedText = localStorage.getItem('textColor');

        if (savedItems) { items = JSON.parse(savedItems); updateWheel(); updateParticipantsList(); }
        if (savedStats) stats = JSON.parse(savedStats);
        if (savedEliminate !== null) eliminateModeCheckbox.checked = savedEliminate === 'true';
        
        if (savedHeads) {
            headsCount = parseInt(savedHeads);
            document.getElementById('heads-count').textContent = headsCount;
        }
        if (savedTails) {
            tailsCount = parseInt(savedTails);
            document.getElementById('tails-count').textContent = tailsCount;
        }

        // Применяем тему
        if (savedBg) bgColorPicker.value = savedBg;
        if (savedText) textColorPicker.value = savedText;
        applyTheme(bgColorPicker.value, textColorPicker.value);
    }

    function exportData() {
        if (!items.length) return alert("Нет данных");
        const blob = new Blob([JSON.stringify({ items, stats })], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `wheel-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    function importData(file) {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.items) {
                    items = data.items;
                    stats = data.stats || {};
                    saveData();
                    updateWheel();
                    updateParticipantsList();
                    alert(`Загружено ${items.length} элементов`);
                }
            } catch (err) { alert("Ошибка файла"); }
        };
        reader.readAsText(file);
    }

    function applyTheme(bg, text) {
        document.body.style.background = bg;
        document.body.style.color = text;
        document.querySelectorAll('.sidebar, .result-display, .theme-panel, .coin-container').forEach(el => {
            el.style.background = adjustColor(bg, 10);
            el.style.borderColor = adjustColor(bg, 20);
        });
    }

    function adjustColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function saveTheme(bg, text) {
        localStorage.setItem('bgColor', bg);
        localStorage.setItem('textColor', text);
    }

    // Слушатели колеса
    uploadAudioBtn.onclick = () => audioFileInput.click();
    audioFileInput.onchange = e => {
        if (e.target.files[0]) {
            spinSound.src = URL.createObjectURL(e.target.files[0]);
            alert('Музыка загружена!');
        }
    };
    themeToggleBtn.onclick = () => themePanel.classList.toggle('active');
    
    [bgColorPicker, textColorPicker].forEach(p => {
        p.oninput = () => {
            applyTheme(bgColorPicker.value, textColorPicker.value);
            saveTheme(bgColorPicker.value, textColorPicker.value);
        };
    });

    resetThemeBtn.onclick = () => {
        bgColorPicker.value = '#0f0f1e';
        textColorPicker.value = '#e0e0e0';
        applyTheme('#0f0f1e', '#e0e0e0');
        saveTheme('#0f0f1e', '#e0e0e0');
    };

    exportBtn.onclick = exportData;
    importBtn.onclick = () => importFileInput.click();
    importFileInput.onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); };
    eliminateModeCheckbox.onchange = saveData;
    addNameBtn.onclick = addItem;
    nameInput.onkeypress = e => { if (e.key === 'Enter') addItem(); };
    clearBtn.onclick = clearAll;
    spinBtn.onclick = spinWheel;
    
    document.onkeydown = e => {
        if ((e.code === 'Space' || e.code === 'Enter') && document.activeElement !== nameInput && !spinBtn.disabled) {
            e.preventDefault();
            spinWheel();
        }
    };

    // === ЛОГИКА МОНЕТЫ ===
    const coin = document.getElementById('coin');
    const flipBtn = document.getElementById('flip-btn');
    const coinResult = document.getElementById('coin-result');
    const headsCountSpan = document.getElementById('heads-count');
    const tailsCountSpan = document.getElementById('tails-count');
    const resetCoinStatsBtn = document.getElementById('reset-coin-stats');
    
    let isFlipping = false;

    flipBtn.addEventListener('click', () => {
        if (isFlipping) return;
        isFlipping = true;
        flipBtn.disabled = true;
        
        coinResult.classList.remove('show');
        coinResult.textContent = '';
        
        coin.classList.add('flipping');
        document.getElementById('coin-wrapper').classList.add('flipping');

        // Честный рандом 50/50
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        let currentAngle = parseFloat(coin.getAttribute('data-angle') || '0');
        // Минимум 10 полных оборотов + случайный угол
        let targetAngle = currentAngle + 3600 + (Math.random() * 360); 
        
        // Корректируем угол, чтобы монета упала нужной стороной
        const remainder = targetAngle % 360;
        if (result === 'heads') {
            targetAngle -= remainder; // Кратно 360 (0 градусов)
        } else {
            targetAngle += (180 - remainder); // Кратно 180 (180 градусов)
        }

        coin.setAttribute('data-angle', targetAngle);
        coin.style.transform = `rotateY(${targetAngle}deg)`;

        setTimeout(() => {
            isFlipping = false;
            flipBtn.disabled = false;
            
            coin.classList.remove('flipping');
            document.getElementById('coin-wrapper').classList.remove('flipping');
            
            if (result === 'heads') {
                headsCount++;
                headsCountSpan.textContent = headsCount;
                coinResult.textContent = 'ОРЕЛ';
                coinResult.style.background = 'linear-gradient(to right, #ffd700, #fff, #ffd700)';
                coinResult.style.webkitBackgroundClip = 'text';
                coinResult.style.backgroundClip = 'text';
                coinResult.style.webkitTextFillColor = 'transparent';
            } else {
                tailsCount++;
                tailsCountSpan.textContent = tailsCount;
                coinResult.textContent = 'РЕШКА';
                coinResult.style.background = 'linear-gradient(to right, #e0e0e0, #fff, #e0e0e0)';
                coinResult.style.webkitBackgroundClip = 'text';
                coinResult.style.backgroundClip = 'text';
                coinResult.style.webkitTextFillColor = 'transparent';
            }
            
            coinResult.classList.add('show');
            saveData();
        }, 3000);
    });

    // Сброс статистики монеты
    resetCoinStatsBtn.addEventListener('click', () => {
        if(confirm('Сбросить статистику орла и решки?')) {
            headsCount = 0;
            tailsCount = 0;
            headsCountSpan.textContent = '0';
            tailsCountSpan.textContent = '0';
            saveData();
        }
    });

    loadData();
    updateWheel();
    // === РАНДОМАЙЗЕР ЧИСЕЛ ===
const generateNumBtn = document.getElementById('generate-num-btn');
const numResult = document.getElementById('num-result');
const numHistoryList = document.getElementById('num-history-list');
const clearNumHistoryBtn = document.getElementById('clear-num-history');
const numHistoryCount = document.getElementById('num-history-count');
const numMinInput = document.getElementById('num-min');
const numMaxInput = document.getElementById('num-max');
const numCountInput = document.getElementById('num-count');
const numUniqueCheckbox = document.getElementById('num-unique');
const numSortCheckbox = document.getElementById('num-sort');

let numHistory = [];
let isGenerating = false;

function generateNumbers() {
    if (isGenerating) return;
    
    const min = parseInt(numMinInput.value) || 0;
    const max = parseInt(numMaxInput.value) || 100;
    let count = parseInt(numCountInput.value) || 1;
    const unique = numUniqueCheckbox.checked;
    const sort = numSortCheckbox.checked;
    
    if (min >= max) {
        alert('Минимум должен быть меньше максимума!');
        return;
    }
    
    const range = max - min + 1;
    if (unique && count > range) {
        alert(`Невозможно сгенерировать ${count} уникальных чисел в диапазоне ${min}-${max}!`);
        count = range;
        numCountInput.value = range;
    }
    
    isGenerating = true;
    generateNumBtn.disabled = true;
    numResult.classList.remove('show');
    numResult.textContent = '🎲 Генерация...';
    
    setTimeout(() => {
        let numbers = [];
        
        if (unique) {
            const available = [];
            for (let i = min; i <= max; i++) available.push(i);
            for (let i = 0; i < count && available.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * available.length);
                numbers.push(available.splice(randomIndex, 1)[0]);
            }
        } else {
            for (let i = 0; i < count; i++) {
                numbers.push(Math.floor(Math.random() * range) + min);
            }
        }
        
        if (sort) numbers.sort((a, b) => a - b);
        
        numResult.innerHTML = numbers.map(n => 
            `<span class="num-result-item">${n}</span>`
        ).join('');
        numResult.classList.add('show');
        
        const historyItem = {
            numbers: numbers,
            timestamp: new Date().toLocaleTimeString('ru-RU'),
            settings: { min, max, count, unique, sort }
        };
        numHistory.unshift(historyItem);
        if (numHistory.length > 50) numHistory.pop();
        
        updateNumHistory();
        saveNumData();
        
        isGenerating = false;
        generateNumBtn.disabled = false;
    }, 500);
}

function updateNumHistory() {
    if (numHistory.length === 0) {
        numHistoryList.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">История пуста</p>';
        numHistoryCount.textContent = 'История: 0';
        return;
    }
    
    numHistoryList.innerHTML = numHistory.map((item, index) => `
        <div class="num-history-item">
            <div>
                <div class="num-history-values">${item.numbers.join(', ')}</div>
                <div class="num-history-time">${item.timestamp} | ${item.settings.min}-${item.settings.max} (${item.settings.count} шт.)</div>
            </div>
            <button class="delete-participant delete-num-history" data-index="${index}" style="width: 28px; height: 28px; font-size: 1rem;">×</button>
        </div>
    `).join('');
    
    numHistoryCount.textContent = `История: ${numHistory.length}`;
    
    // Добавляем обработчики на кнопки удаления
    document.querySelectorAll('.delete-num-history').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            numHistory.splice(index, 1);
            updateNumHistory();
            saveNumData();
        });
    });
}

function clearNumHistory() {
    if (confirm('Очистить историю генераций?')) {
        numHistory = [];
        updateNumHistory();
        saveNumData();
    }
}

function saveNumData() {
    localStorage.setItem('numHistory', JSON.stringify(numHistory));
    localStorage.setItem('numSettings', JSON.stringify({
        min: numMinInput.value,
        max: numMaxInput.value,
        count: numCountInput.value,
        unique: numUniqueCheckbox.checked,
        sort: numSortCheckbox.checked
    }));
}

function loadNumData() {
    const savedHistory = localStorage.getItem('numHistory');
    const savedSettings = localStorage.getItem('numSettings');
    
    if (savedHistory) {
        numHistory = JSON.parse(savedHistory);
        updateNumHistory();
    }
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        numMinInput.value = settings.min || 1;
        numMaxInput.value = settings.max || 100;
        numCountInput.value = settings.count || 1;
        numUniqueCheckbox.checked = settings.unique !== false;
        numSortCheckbox.checked = settings.sort || false;
    }
}

// Слушатели событий
if (generateNumBtn) {
    generateNumBtn.addEventListener('click', generateNumbers);
}
if (clearNumHistoryBtn) {
    clearNumHistoryBtn.addEventListener('click', clearNumHistory);
}

[numMinInput, numMaxInput, numCountInput].forEach(input => {
    if (input) {
        input.addEventListener('change', saveNumData);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !isGenerating) generateNumbers();
        });
    }
});

[numUniqueCheckbox, numSortCheckbox].forEach(chk => {
    if (chk) chk.addEventListener('change', saveNumData);
});

loadNumData();
// === ГЕНЕРАТОР ПАРОЛЕЙ ===
const generatePwdBtn = document.getElementById('generate-pwd-btn');
const copyPwdBtn = document.getElementById('copy-pwd-btn');
const refreshPwdBtn = document.getElementById('refresh-pwd-btn');
const pwdResult = document.getElementById('pwd-result');
const pwdLength = document.getElementById('pwd-length');
const pwdLengthValue = document.getElementById('pwd-length-value');
const pwdUppercase = document.getElementById('pwd-uppercase');
const pwdLowercase = document.getElementById('pwd-lowercase');
const pwdNumbers = document.getElementById('pwd-numbers');
const pwdSymbols = document.getElementById('pwd-symbols');
const pwdStrength = document.getElementById('pwd-strength');
const pwdStrengthText = document.getElementById('pwd-strength-text');
const pwdHistoryList = document.getElementById('pwd-history-list');
const clearPwdHistoryBtn = document.getElementById('clear-pwd-history');

let pwdHistory = [];
let currentPassword = '';

const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

function generatePassword() {
    let charset = '';
    if (pwdUppercase.checked) charset += CHAR_SETS.uppercase;
    if (pwdLowercase.checked) charset += CHAR_SETS.lowercase;
    if (pwdNumbers.checked) charset += CHAR_SETS.numbers;
    if (pwdSymbols.checked) charset += CHAR_SETS.symbols;
    
    if (charset === '') {
        alert('Выберите хотя бы один тип символов!');
        return null;
    }
    
    let password = '';
    const length = parseInt(pwdLength.value);
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
}

function calculateStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 3) return { text: 'Слабый', class: 'pwd-strength-weak' };
    if (score <= 5) return { text: 'Средний', class: 'pwd-strength-medium' };
    return { text: 'Надёжный', class: 'pwd-strength-strong' };
}

function updatePwdStrength(password) {
    const strength = calculateStrength(password);
    pwdStrength.className = '';
    pwdStrength.classList.add(strength.class);
    pwdStrengthText.textContent = strength.text;
}

function updatePwdHistory() {
    if (pwdHistory.length === 0) {
        pwdHistoryList.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">История пуста</p>';
        return;
    }
    pwdHistoryList.innerHTML = pwdHistory.map((item, index) => `
        <div class="pwd-history-item">
            <div class="pwd-history-value">${item.password}</div>
            <div class="pwd-history-meta">
                <div>${item.length} симв.</div>
                <div>${item.timestamp}</div>
            </div>
            <button class="delete-participant delete-pwd-history" data-index="${index}" style="width: 28px; height: 28px; font-size: 1rem; margin-left: 10px;">×</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.delete-pwd-history').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            pwdHistory.splice(index, 1);
            updatePwdHistory();
            savePwdData();
        });
    });
}

function showPassword(password) {
    currentPassword = password;
    pwdResult.textContent = password;
    pwdResult.classList.add('show');
    updatePwdStrength(password);
    
    pwdHistory.unshift({
        password: password,
        length: password.length,
        timestamp: new Date().toLocaleTimeString('ru-RU')
    });
    if (pwdHistory.length > 20) pwdHistory.pop();
    updatePwdHistory();
    savePwdData();
}

function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function copyPassword() {
    if (!currentPassword) {
        alert('Сначала сгенерируйте пароль!');
        return;
    }
    navigator.clipboard.writeText(currentPassword).then(() => {
        showToast('✅ Пароль скопирован!');
    });
}

function savePwdData() {
    localStorage.setItem('pwdHistory', JSON.stringify(pwdHistory));
    localStorage.setItem('pwdSettings', JSON.stringify({
        length: pwdLength.value,
        uppercase: pwdUppercase.checked,
        lowercase: pwdLowercase.checked,
        numbers: pwdNumbers.checked,
        symbols: pwdSymbols.checked
    }));
}

function loadPwdData() {
    const savedHistory = localStorage.getItem('pwdHistory');
    const savedSettings = localStorage.getItem('pwdSettings');
    if (savedHistory) {
        pwdHistory = JSON.parse(savedHistory);
        updatePwdHistory();
    }
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        pwdLength.value = settings.length || 16;
        pwdLengthValue.textContent = settings.length || 16;
        pwdUppercase.checked = settings.uppercase !== false;
        pwdLowercase.checked = settings.lowercase !== false;
        pwdNumbers.checked = settings.numbers !== false;
        pwdSymbols.checked = settings.symbols !== false;
    }
}

if (generatePwdBtn) generatePwdBtn.addEventListener('click', () => {
    const password = generatePassword();
    if (password) showPassword(password);
});
if (copyPwdBtn) copyPwdBtn.addEventListener('click', copyPassword);
if (refreshPwdBtn) refreshPwdBtn.addEventListener('click', () => {
    const password = generatePassword();
    if (password) showPassword(password);
});
if (clearPwdHistoryBtn) clearPwdHistoryBtn.addEventListener('click', () => {
    if (confirm('Очистить историю паролей?')) {
        pwdHistory = [];
        updatePwdHistory();
        savePwdData();
    }
});
if (pwdLength) {
    pwdLength.addEventListener('input', () => {
        pwdLengthValue.textContent = pwdLength.value;
        savePwdData();
    });
}
[pwdUppercase, pwdLowercase, pwdNumbers, pwdSymbols].forEach(chk => {
    if (chk) chk.addEventListener('change', savePwdData);
});
loadPwdData();

// === ГЕНЕРАТОР НИКНЕЙМОВ ===
const generateNickBtn = document.getElementById('generate-nick-btn');
const nickResults = document.getElementById('nick-results');
const nickCategory = document.getElementById('nick-category');
const nickBaseName = document.getElementById('nick-base-name');
const nameInputWrapper = document.getElementById('name-input-wrapper');
const nickAddNumbers = document.getElementById('nick-add-numbers');
const nickSpecialChars = document.getElementById('nick-special-chars');
const nickXStyle = document.getElementById('nick-x-style');
const nickCaps = document.getElementById('nick-caps');
const nickLength = document.getElementById('nick-length');
const copyAllNicks = document.getElementById('copy-all-nicks');
const regenerateNicks = document.getElementById('regenerate-nicks');
const nickFavoritesList = document.getElementById('nick-favorites-list');
const nickHistoryList = document.getElementById('nick-history-list');
const clearNickHistory = document.getElementById('clear-nick-history');
const saveFavoriteNick = document.getElementById('save-favorite-nick');

let currentNicks = [];
let nickFavorites = [];
let nickHistory = [];

const nickWords = {
    gaming: {
        prefixes: ['Pro', 'xX', 'Dark', 'Shadow', 'Night', 'Cyber', 'Neo', 'Ultra', 'Mega', 'Epic'],
        roots: ['Slayer', 'Hunter', 'Killer', 'Warrior', 'Ninja', 'Dragon', 'Wolf', 'Phoenix', 'Storm', 'Venom'],
        suffixes: ['Xx', 'YT', 'Gaming', 'Pro', 'HD', '2024', 'OP', 'GG', 'WP', 'EZ']
    },
    creative: {
        prefixes: ['Cosmic', 'Lunar', 'Solar', 'Mystic', 'Ethereal', 'Quantum', 'Nebula', 'Prism', 'Silent', 'Wild'],
        roots: ['Dream', 'Whisper', 'Shadow', 'Flame', 'Wave', 'Bloom', 'Spark', 'Glow', 'Light', 'Mist'],
        suffixes: ['er', 'or', 'ian', 'ist', 'ix', 'ex', 'ax', 'ux', 'yx', 'zx']
    },
    fantasy: {
        prefixes: ['Aer', 'Bal', 'Dar', 'Eld', 'Fal', 'Gal', 'Ith', 'Kal', 'Lor', 'Thor'],
        roots: ['dragon', 'shadow', 'blade', 'storm', 'flame', 'frost', 'moon', 'star', 'fire', 'void'],
        suffixes: ['dor', 'ion', 'ius', 'ar', 'or', 'en', 'in', 'an', 'th', 'oth']
    },
    cool: {
        prefixes: ['Bad', 'Mad', 'Sick', 'Savage', 'Brutal', 'Fearless', 'Deadly', 'Toxic', 'Rapid', 'Sharp'],
        roots: ['Boy', 'Soul', 'Heart', 'Mind', 'Eye', 'Fist', 'Claw', 'Fang', 'Steel', 'Gold'],
        suffixes: ['666', '999', '13', '88', '420', 'X', 'Z', 'K', 'R', 'T']
    },
    cute: {
        prefixes: ['Cute', 'Sweet', 'Lovely', 'Adorable', 'Fluffy', 'Soft', 'Tiny', 'Baby', 'Angel', 'Honey'],
        roots: ['Bear', 'Cat', 'Bunny', 'Panda', 'Fox', 'Flower', 'Star', 'Moon', 'Cloud', 'Candy'],
        suffixes: ['kins', 'pie', 'bug', 'boo', 'bear', 'pop', 'drop', 'bell', 'dust', 'wish']
    }
};

const specialChars = ['_', '-', '.', '__', '--', '_.', '_-'];

function showNameInput() {
    if (nameInputWrapper) {
        nameInputWrapper.style.display = nickCategory && nickCategory.value === 'based' ? 'block' : 'none';
    }
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ОГРАНИЧЕНИЯ ДЛИНЫ ===
function applyLengthConstraint(nick) {
    const lengthType = nickLength ? nickLength.value : 'medium';
    const lengths = {
        short: { min: 3, max: 6 },
        medium: { min: 7, max: 12 },
        long: { min: 13, max: 20 }
    };
    
    const target = lengths[lengthType];
    let result = nick;
    
    // Если ник слишком длинный - обрезаем
    if (result.length > target.max) {
        result = result.substring(0, target.max);
    }
    
    // Если ник слишком короткий - добавляем символы
    while (result.length < target.min) {
        if (nickAddNumbers && nickAddNumbers.checked) {
            result += Math.floor(Math.random() * 10);
        } else {
            const extras = ['x', 'z', 'q', 'v', 'y', 'X', 'Z', 'Q'];
            result += extras[Math.floor(Math.random() * extras.length)];
        }
    }
    
    return result;
}

function applyStyle(nick) {
    let result = nick;
    
    // Спецсимволы
    if (nickSpecialChars && nickSpecialChars.checked && Math.random() > 0.5) {
        const char = getRandomItem(specialChars);
        result = Math.random() > 0.5 ? char + result : result + char;
    }
    
    // xX стиль
    if (nickXStyle && nickXStyle.checked) {
        result = `xX_${result}_Xx`;
    }
    
    // Чередование регистра
    if (nickCaps && nickCaps.checked && !nickXStyle.checked) {
        let capped = '';
        for (let i = 0; i < result.length; i++) {
            capped += Math.random() > 0.5 ? result[i].toUpperCase() : result[i].toLowerCase();
        }
        result = capped;
    }
    
    // Цифры
    if (nickAddNumbers && nickAddNumbers.checked && Math.random() > 0.5) {
        result += Math.floor(Math.random() * 100);
    }
    
    return result;
}

function generateNickFromCategory(category) {
    let nick = '';
    
    if (category === 'based' && nickBaseName && nickBaseName.value.trim()) {
        const name = nickBaseName.value.trim();
        const variations = [
            name, 
            name + Math.floor(Math.random() * 1000), 
            '_' + name + '_', 
            'xX' + name + 'Xx', 
            'The' + name,
            name + 'Pro',
            'i' + name,
            name + 'YT'
        ];
        nick = getRandomItem(variations);
    } else {
        const words = nickWords[category] || nickWords.gaming;
        const prefix = getRandomItem(words.prefixes);
        const root = getRandomItem(words.roots);
        const suffix = Math.random() > 0.5 ? getRandomItem(words.suffixes) : '';
        nick = prefix + root + suffix;
    }
    
    // Применяем стили
    nick = applyStyle(nick);
    
    // Применяем ограничение длины
    nick = applyLengthConstraint(nick);
    
    return nick;
}

function generateNicknames() {
    const count = 12;
    const category = nickCategory ? nickCategory.value : 'gaming';
    currentNicks = [];
    
    for (let i = 0; i < count; i++) {
        currentNicks.push(generateNickFromCategory(category));
    }
    displayNicknames(currentNicks);
    addToHistory(currentNicks);
}

function displayNicknames(nicks) {
    if (!nickResults) return;
    nickResults.innerHTML = nicks.map((nick, index) => `
        <div class="nick-result-item" style="animation-delay: ${index * 0.05}s">
            <div class="nick-text">${nick}</div>
            <div class="nick-actions">
                <button class="nick-action-btn" onclick="copySingleNick('${nick}')">📋 Копировать</button>
                <button class="nick-action-btn" onclick="toggleFavorite('${nick}', this)">⭐ В избранное</button>
            </div>
        </div>
    `).join('');
}

function copySingleNick(nick) {
    navigator.clipboard.writeText(nick).then(() => {
        showToast('✅ Ник скопирован!');
    });
}

function toggleFavorite(nick, btn) {
    const index = nickFavorites.indexOf(nick);
    if (index > -1) {
        nickFavorites.splice(index, 1);
        btn.classList.remove('favorite');
        btn.textContent = '⭐ В избранное';
    } else {
        nickFavorites.push(nick);
        btn.classList.add('favorite');
        btn.textContent = '★ В избранном';
        updateFavoritesList();
    }
    saveNickData();
}

function addToHistory(nicks) {
    nickHistory.unshift({
        nicks: nicks.slice(0, 5),
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        category: nickCategory ? nickCategory.value : 'gaming'
    });
    if (nickHistory.length > 20) nickHistory.pop();
    updateHistoryList();
    saveNickData();
}

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ updateFavoritesList ===
function updateFavoritesList() {
    if (!nickFavoritesList) return;
    if (nickFavorites.length === 0) {
        nickFavoritesList.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">Нет избранных</p>';
        return;
    }
    nickFavoritesList.innerHTML = nickFavorites.map((nick, index) => `
        <div class="nick-favorite-item">
            <span class="nick-fav-text">${nick}</span>
            <button class="delete-participant remove-fav-btn" data-index="${index}" style="width: 24px; height: 24px; font-size: 0.9rem;">×</button>
        </div>
    `).join('');
    
    // Добавляем обработчики на кнопки удаления
    document.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            nickFavorites.splice(index, 1);
            updateFavoritesList();
            saveNickData();
        });
    });
}

function updateHistoryList() {
    if (!nickHistoryList) return;
    if (nickHistory.length === 0) {
        nickHistoryList.innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">История пуста</p>';
        return;
    }
    nickHistoryList.innerHTML = nickHistory.map(item => `
        <div class="nick-history-item">
            <span class="nick-history-text">${item.nicks.join(', ')}</span>
            <span style="color: #666; font-size: 0.75rem;">${item.timestamp}</span>
        </div>
    `).join('');
}

function saveNickData() {
    localStorage.setItem('nickFavorites', JSON.stringify(nickFavorites));
    localStorage.setItem('nickHistory', JSON.stringify(nickHistory));
}

function loadNickData() {
    const savedFavorites = localStorage.getItem('nickFavorites');
    const savedHistory = localStorage.getItem('nickHistory');
    if (savedFavorites) {
        nickFavorites = JSON.parse(savedFavorites);
        updateFavoritesList();
    }
    if (savedHistory) {
        nickHistory = JSON.parse(savedHistory);
        updateHistoryList();
    }
    if (nickCategory) showNameInput();
}

// Слушатели событий
if (nickCategory) nickCategory.addEventListener('change', showNameInput);
if (generateNickBtn) generateNickBtn.addEventListener('click', generateNicknames);
if (regenerateNicks) regenerateNicks.addEventListener('click', generateNicknames);
if (copyAllNicks) copyAllNicks.addEventListener('click', () => {
    if (currentNicks.length === 0) {
        alert('Сначала сгенерируйте ники!');
        return;
    }
    navigator.clipboard.writeText(currentNicks.join('\n')).then(() => {
        showToast('✅ Скопировано ' + currentNicks.length + ' ников!');
    });
});
if (saveFavoriteNick) saveFavoriteNick.addEventListener('click', () => {
    if (currentNicks.length === 0) {
        alert('Сначала сгенерируйте ники!');
        return;
    }
    let saved = 0;
    currentNicks.forEach(nick => {
        if (!nickFavorites.includes(nick)) {
            nickFavorites.push(nick);
            saved++;
        }
    });
    updateFavoritesList();
    saveNickData();
    showToast('⭐ Сохранено ' + saved + ' ников!');
});
if (clearNickHistory) clearNickHistory.addEventListener('click', () => {
    if (confirm('Очистить историю ников?')) {
        nickHistory = [];
        updateHistoryList();
        saveNickData();
    }
});

// Глобальная функция для копирования (чтобы работала из HTML onclick)
window.copySingleNick = function(nick) {
    navigator.clipboard.writeText(nick).then(() => {
        showToast('✅ Ник скопирован!');
    });
};

// Глобальная функция для избранного (чтобы работала из HTML onclick)
window.toggleFavorite = function(nick, btn) {
    const index = nickFavorites.indexOf(nick);
    if (index > -1) {
        nickFavorites.splice(index, 1);
        btn.classList.remove('favorite');
        btn.textContent = '⭐ В избранное';
    } else {
        nickFavorites.push(nick);
        btn.classList.add('favorite');
        btn.textContent = '★ В избранном';
        updateFavoritesList();
    }
    saveNickData();
};

loadNickData();
// === КОНФИДЕНЦИАЛЬНОСТЬ ===
const privacyBtn = document.getElementById('privacy-btn');
const privacyModal = document.getElementById('privacy-modal');
const privacyClose = document.getElementById('privacy-close');
const privacyAccept = document.getElementById('privacy-accept');

if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
        privacyModal.classList.add('active');
    });
}

if (privacyClose) {
    privacyClose.addEventListener('click', () => {
        privacyModal.classList.remove('active');
    });
}

if (privacyAccept) {
    privacyAccept.addEventListener('click', () => {
        privacyModal.classList.remove('active');
    });
}

if (privacyModal) {
    privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.classList.remove('active');
        }
    });
}
})