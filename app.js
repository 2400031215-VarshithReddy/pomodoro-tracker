// AuraFlow Application Engine

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE DEFINITIONS & LOCAL STORAGE
  // ==========================================
  
  // Load settings from localStorage or defaults
  let settings = JSON.parse(localStorage.getItem('auraflow_settings')) || {
    work: 25,
    short: 5,
    long: 15
  };
  
  // Load completed focus sessions count
  let totalFocusSessions = parseInt(localStorage.getItem('auraflow_focus_sessions')) || 0;
  
  // Load habits
  let habits = JSON.parse(localStorage.getItem('auraflow_habits')) || [
    // Pre-populate with two sample habits for demonstration if empty
    {
      id: 'habit_demo_1',
      name: 'Read 15 Pages',
      color: 'purple',
      createdAt: new Date().toISOString(),
      history: {}
    },
    {
      id: 'habit_demo_2',
      name: 'Drink 3L Water',
      color: 'emerald',
      createdAt: new Date().toISOString(),
      history: {}
    }
  ];

  // Sound configuration
  let soundEnabled = localStorage.getItem('auraflow_sound_enabled') !== 'false'; // default true
  
  // Timer State Variables
  let timerInterval = null;
  let currentMode = 'work'; // 'work', 'short', 'long'
  let timeLeft = settings.work * 60;
  let isTimerRunning = false;

  // Audio Context (initialized on demand due to browser policies)
  let audioCtx = null;

  // ==========================================
  // DOM ELEMENT REFERENCES
  // ==========================================
  
  // Timer Display
  const timeDisplay = document.getElementById('time-display');
  const timerStateLabel = document.getElementById('timer-state-label');
  const timerProgress = document.getElementById('timer-progress');
  
  // Timer Mode Controls
  const modeBtnWork = document.getElementById('mode-work');
  const modeBtnShort = document.getElementById('mode-short');
  const modeBtnLong = document.getElementById('mode-long');
  const modeBtns = [modeBtnWork, modeBtnShort, modeBtnLong];
  
  // Timer Controls
  const btnStartPause = document.getElementById('timer-start-pause');
  const btnReset = document.getElementById('timer-reset');
  const btnToggleSound = document.getElementById('timer-toggle-sound');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  
  // Settings Panel
  const btnSettingsToggle = document.getElementById('settings-toggle-btn');
  const settingsPanel = document.getElementById('timer-settings-panel');
  const btnSettingsClose = document.getElementById('settings-close-btn');
  const btnSettingsSave = document.getElementById('settings-save-btn');
  const inputWork = document.getElementById('input-work');
  const inputShort = document.getElementById('input-short');
  const inputLong = document.getElementById('input-long');

  // Habit Tracker Panel
  const btnAddHabitToggle = document.getElementById('add-habit-toggle');
  const addHabitFormContainer = document.getElementById('add-habit-form-container');
  const addHabitForm = document.getElementById('add-habit-form');
  const habitNameInput = document.getElementById('habit-name-input');
  const btnAddHabitCancel = document.getElementById('add-habit-cancel');
  const habitsList = document.getElementById('habits-list');
  const habitsEmptyState = document.getElementById('habits-empty-state');
  
  // Stats Counters
  const valTotalFocusSessions = document.querySelector('#total-focus-sessions .stat-value');
  const valHabitWeeklyProgress = document.querySelector('#habit-weekly-progress .stat-value');

  // ==========================================
  // AUDIO SYNTHESIS ENGINE (Web Audio API)
  // ==========================================
  
  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, startTime) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + startTime);
      osc.stop(audioCtx.currentTime + startTime + duration);
    } catch (e) {
      console.warn("Tone play failed:", e);
    }
  }

  function triggerChime(isStart) {
    initAudioContext();
    if (!soundEnabled) return;
    
    if (isStart) {
      // Warm upward arpeggio (C Major) for starting focus
      playTone(523.25, 0.12, 0);     // C5
      playTone(659.25, 0.15, 0.08);  // E5
      playTone(783.99, 0.3, 0.16);   // G5
    } else {
      // Relaxing descending tones for break starts
      playTone(587.33, 0.15, 0);     // D5
      playTone(493.88, 0.15, 0.1);    // B4
      playTone(392.00, 0.35, 0.2);    // G4
    }
  }

  // Toggle sound mode UI & State
  function updateSoundUI() {
    if (soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      btnToggleSound.classList.remove('active');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      btnToggleSound.classList.add('active');
    }
  }

  btnToggleSound.addEventListener('click', () => {
    initAudioContext();
    soundEnabled = !soundEnabled;
    localStorage.setItem('auraflow_sound_enabled', soundEnabled);
    updateSoundUI();
    
    if (soundEnabled) {
      // Play a quick chime to verify
      playTone(659.25, 0.15, 0);
    }
    showToast(soundEnabled ? "Audio notifications enabled" : "Audio muted");
  });

  // ==========================================
  // UI TOAST FEEDBACK HELPER
  // ==========================================
  
  function showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after animation completes
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 3300);
  }

  // ==========================================
  // POMODORO TIMER ENGINE
  // ==========================================

  // Circular SVG progress bar initialization
  const radius = timerProgress.r.baseVal.value;
  const circumference = 2 * Math.PI * radius; // Approx 753.98
  timerProgress.style.strokeDasharray = `${circumference} ${circumference}`;
  
  function setProgressPercent(percent) {
    const offset = circumference - (percent / 100) * circumference;
    timerProgress.style.strokeDashoffset = offset;
  }

  // Set mode lengths on input forms
  inputWork.value = settings.work;
  inputShort.value = settings.short;
  inputLong.value = settings.long;

  // Initialize display metrics
  valTotalFocusSessions.textContent = totalFocusSessions;

  function getTimerTotalSeconds() {
    return settings[currentMode] * 60;
  }

  function renderTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    const timeStr = `${minutesStr}:${secondsStr}`;
    
    timeDisplay.textContent = timeStr;
    
    // Synchronize page document title
    const modeLabel = currentMode === 'work' ? 'Focus' : 'Break';
    document.title = `[${timeStr}] AuraFlow // ${modeLabel}`;
    
    // Update SVG circle
    const totalSeconds = getTimerTotalSeconds();
    const percent = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;
    setProgressPercent(percent);
  }

  function updateModeUI() {
    modeBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${currentMode}`).classList.add('active');
    
    // Update state text
    if (currentMode === 'work') {
      timerStateLabel.textContent = "GET TO WORK";
      timerStateLabel.style.color = "var(--accent-purple)";
      document.documentElement.style.setProperty('--accent-timer-start', 'var(--accent-purple)');
      document.documentElement.style.setProperty('--accent-timer-end', 'var(--accent-pink)');
    } else if (currentMode === 'short') {
      timerStateLabel.textContent = "SHORT BREAK";
      timerStateLabel.style.color = "var(--accent-blue)";
      document.documentElement.style.setProperty('--accent-timer-start', 'var(--accent-blue)');
      document.documentElement.style.setProperty('--accent-timer-end', 'var(--accent-emerald)');
    } else {
      timerStateLabel.textContent = "RELAX STRETCH";
      timerStateLabel.style.color = "var(--accent-emerald)";
      document.documentElement.style.setProperty('--accent-timer-start', 'var(--accent-emerald)');
      document.documentElement.style.setProperty('--accent-timer-end', 'var(--accent-blue)');
    }
  }

  function setMode(mode) {
    stopTimer();
    currentMode = mode;
    timeLeft = settings[mode] * 60;
    updateModeUI();
    renderTimer();
  }

  function startTimer() {
    initAudioContext();
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    
    // Adjust button icons
    btnStartPause.querySelector('.play-icon').classList.add('hidden');
    btnStartPause.querySelector('.pause-icon').classList.remove('hidden');
    document.getElementById('start-btn-text').textContent = "Pause Session";
    
    // Trigger sound
    triggerChime(true);
    
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        renderTimer();
      } else {
        handleTimerCompletion();
      }
    }, 1000);
  }

  function stopTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    
    btnStartPause.querySelector('.play-icon').classList.remove('hidden');
    btnStartPause.querySelector('.pause-icon').classList.add('hidden');
    document.getElementById('start-btn-text').textContent = currentMode === 'work' ? "Start Focus" : "Start Break";
  }

  function handleTimerCompletion() {
    stopTimer();
    triggerChime(false);
    
    if (currentMode === 'work') {
      totalFocusSessions++;
      localStorage.setItem('auraflow_focus_sessions', totalFocusSessions);
      valTotalFocusSessions.textContent = totalFocusSessions;
      
      showToast("Splendid! Focus session completed!");
      
      // Auto cycle to short break
      setMode('short');
    } else {
      showToast("Break completed! Ready to focus?");
      setMode('work');
    }
  }

  // Attach button triggers for modes
  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.getAttribute('data-mode');
      setMode(mode);
    });
  });

  // Toggle Start / Pause
  btnStartPause.addEventListener('click', () => {
    if (isTimerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  // Reset
  btnReset.addEventListener('click', () => {
    initAudioContext();
    stopTimer();
    timeLeft = getTimerTotalSeconds();
    renderTimer();
    showToast("Timer reset");
  });

  // ==========================================
  // TIMER SETTINGS ACTIONS
  // ==========================================
  
  btnSettingsToggle.addEventListener('click', () => {
    initAudioContext();
    settingsPanel.classList.toggle('open');
  });

  btnSettingsClose.addEventListener('click', () => {
    settingsPanel.classList.remove('open');
  });

  btnSettingsSave.addEventListener('click', () => {
    const workVal = Math.max(1, Math.min(60, parseInt(inputWork.value) || 25));
    const shortVal = Math.max(1, Math.min(60, parseInt(inputShort.value) || 5));
    const longVal = Math.max(1, Math.min(60, parseInt(inputLong.value) || 15));
    
    settings = { work: workVal, short: shortVal, long: longVal };
    localStorage.setItem('auraflow_settings', JSON.stringify(settings));
    
    settingsPanel.classList.remove('open');
    setMode(currentMode); // Update currently active state values
    showToast("Timer configuration saved");
  });

  // ==========================================
  // HABIT TRACKER ENGINE & STREAKS
  // ==========================================

  // Determine current week days (Monday - Sunday)
  function getWeekDates() {
    const now = new Date();
    const day = now.getDay();
    // Monday offset
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      weekDates.push(`${yyyy}-${mm}-${dd}`);
    }
    return weekDates;
  }

  // Format date helper YYYY-MM-DD
  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Streak Calculation algorithm
  function calculateStreak(history) {
    let streak = 0;
    const now = new Date();
    let checkDate = new Date(now);
    
    const todayStr = formatDate(checkDate);
    
    let yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    const startFromToday = history[todayStr] === true;
    const startFromYesterday = history[yesterdayStr] === true;
    
    if (!startFromToday && !startFromYesterday) {
      return 0;
    }
    
    let current = startFromToday ? checkDate : yesterday;
    while (true) {
      const dateStr = formatDate(current);
      if (history[dateStr] === true) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // Aggregate completion rate for current week
  function updateCompletionStats() {
    if (habits.length === 0) {
      valHabitWeeklyProgress.textContent = "0%";
      return;
    }
    
    const weekDates = getWeekDates();
    let totalPossible = habits.length * 7;
    let checkedCount = 0;
    
    habits.forEach(habit => {
      weekDates.forEach(dateStr => {
        if (habit.history[dateStr] === true) {
          checkedCount++;
        }
      });
    });
    
    const rate = Math.round((checkedCount / totalPossible) * 100);
    valHabitWeeklyProgress.textContent = `${rate}%`;
  }

  // Toggle habit tracker check status
  window.toggleHabitDay = function(habitId, dateStr) {
    initAudioContext();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // Toggle history
    if (habit.history[dateStr] === true) {
      delete habit.history[dateStr];
      playTone(400, 0.08, 0); // lower feedback chime
    } else {
      habit.history[dateStr] = true;
      // High bright sound feedback on complete
      playTone(880, 0.1, 0); 
      playTone(1100, 0.15, 0.05);
    }
    
    // Save state
    localStorage.setItem('auraflow_habits', JSON.stringify(habits));
    
    // Redraw and recalculate
    renderHabits();
    updateCompletionStats();
  };

  // Delete habit
  window.deleteHabit = function(habitId) {
    habits = habits.filter(h => h.id !== habitId);
    localStorage.setItem('auraflow_habits', JSON.stringify(habits));
    
    renderHabits();
    updateCompletionStats();
    showToast("Habit deleted");
  };

  // Render Habits List UI
  function renderHabits() {
    if (habits.length === 0) {
      habitsEmptyState.classList.remove('hidden');
      habitsList.querySelectorAll('.habit-item').forEach(item => item.remove());
      updateCompletionStats();
      return;
    }
    
    habitsEmptyState.classList.add('hidden');
    
    // Get existing elements
    const habitItems = habitsList.querySelectorAll('.habit-item');
    const existingIds = new Set(habits.map(h => h.id));
    
    // Clean deleted cards
    habitItems.forEach(item => {
      const id = item.getAttribute('data-id');
      if (!existingIds.has(id)) {
        item.remove();
      }
    });

    const weekDates = getWeekDates();
    
    habits.forEach(habit => {
      const streak = calculateStreak(habit.history);
      let existingCard = habitsList.querySelector(`.habit-item[data-id="${habit.id}"]`);
      
      // Determine day-by-day checked classes
      let daysHtml = '';
      weekDates.forEach(dateStr => {
        const isChecked = habit.history[dateStr] === true;
        const checkedClass = isChecked ? 'checked' : '';
        daysHtml += `<div class="day-chk ${checkedClass}" onclick="toggleHabitDay('${habit.id}', '${dateStr}')" title="${dateStr}"></div>`;
      });

      const cardInnerHtml = `
        <div class="habit-info">
          <span class="habit-name" title="${habit.name}">${habit.name}</span>
          <div class="habit-actions-row">
            <button class="btn-delete-habit" onclick="deleteHabit('${habit.id}')" aria-label="Delete Habit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div class="habit-days">
          ${daysHtml}
        </div>
        <div class="habit-streak-badge">
          <span class="streak-count ${streak > 0 ? 'active' : 'inactive'}">
            ${streak > 0 ? `🔥 ${streak}` : '0'}
          </span>
          <span class="streak-label">streak</span>
        </div>
      `;

      if (existingCard) {
        // Update existing element to prevent re-creating DOM cards completely
        existingCard.className = `habit-item theme-${habit.color}`;
        existingCard.innerHTML = cardInnerHtml;
      } else {
        // Create new habit card
        const card = document.createElement('div');
        card.className = `habit-item theme-${habit.color}`;
        card.setAttribute('data-id', habit.id);
        card.innerHTML = cardInnerHtml;
        habitsList.appendChild(card);
      }
    });
  }

  // ==========================================
  // HABIT CREATION FORM TRIGGERS
  // ==========================================

  btnAddHabitToggle.addEventListener('click', () => {
    initAudioContext();
    addHabitFormContainer.classList.toggle('collapsed');
    if (!addHabitFormContainer.classList.contains('collapsed')) {
      habitNameInput.focus();
    }
  });

  btnAddHabitCancel.addEventListener('click', () => {
    addHabitFormContainer.classList.add('collapsed');
    addHabitForm.reset();
  });

  addHabitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initAudioContext();
    
    const name = habitNameInput.value.trim();
    if (!name) return;
    
    const colorOpt = document.querySelector('input[name="habit-color"]:checked');
    const color = colorOpt ? colorOpt.value : 'purple';
    
    const newHabit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name,
      color: color,
      createdAt: new Date().toISOString(),
      history: {}
    };
    
    habits.unshift(newHabit);
    localStorage.setItem('auraflow_habits', JSON.stringify(habits));
    
    // Reset and close
    addHabitForm.reset();
    addHabitFormContainer.classList.add('collapsed');
    
    // Redraw habits
    renderHabits();
    updateCompletionStats();
    
    showToast(`Habit "${name}" created!`);
    
    // Play celebratory tone
    playTone(523.25, 0.1, 0);
    playTone(659.25, 0.1, 0.05);
    playTone(880.00, 0.2, 0.1);
  });

  // ==========================================
  // DRAWER INTERACTION CLOSURES (Click Outside / Scroll Close)
  // ==========================================
  
  // Close drawers when clicking outside their card areas
  document.addEventListener('click', (e) => {
    // Settings panel click-outside check
    if (settingsPanel.classList.contains('open')) {
      if (!settingsPanel.contains(e.target) && !btnSettingsToggle.contains(e.target)) {
        settingsPanel.classList.remove('open');
      }
    }
    // Add habit panel click-outside check
    if (!addHabitFormContainer.classList.contains('collapsed')) {
      if (!addHabitFormContainer.contains(e.target) && !btnAddHabitToggle.contains(e.target)) {
        addHabitFormContainer.classList.add('collapsed');
        addHabitForm.reset();
      }
    }
  });

  // Close drawers when the main window view scrolls
  window.addEventListener('scroll', () => {
    if (settingsPanel.classList.contains('open')) {
      settingsPanel.classList.remove('open');
    }
    if (!addHabitFormContainer.classList.contains('collapsed')) {
      addHabitFormContainer.classList.add('collapsed');
      addHabitForm.reset();
    }
  }, { passive: true });

  // ==========================================
  // INITIAL RUN STATE INVOCATIONS
  // ==========================================
  
  updateSoundUI();
  setMode('work');
  renderHabits();
  updateCompletionStats();
});
