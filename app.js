// app.js

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const app = (function() {
    // Initial State structure
    const defaultState = {
        theme: 'dark', // 'dark' or 'light'
        currentView: 'DASHBOARD',
        selectedDay: DAYS[new Date().getDay()],
        lastResetDate: new Date().toDateString(),
        completedIds: [], // array of IDs
        activeProfileId: 'default',
        profiles: [{ id: 'default', name: "Commander Vector", birthdate: "2000-01-01", avatar: null }],
        currentStreak: 0,
        dayGoalReached: false,
        almostDoneNotified: false,
        lives: 5,
        history: [],
        rechargeData: [
            { id: 'hydration', label: 'HYDRATION', current: 0, total: 8, time: '08:00 AM' },
            { id: 'meditation', label: 'MEDITATION', current: 0, total: 1, time: '07:00 AM' },
            { id: 'reading', label: 'READING INTEL', current: 0, total: 1, time: '09:00 PM' }
        ],
        fluxTasks: [
            { id: 't1', task: 'Review System Logs', time: '09:00 AM', day: DAYS[new Date().getDay()] },
            { id: 't2', task: 'Tactical Workout', time: '05:00 PM', day: DAYS[new Date().getDay()] }
        ],
        weeklyPlan: {}
    };

    defaultState.weeklyPlan = {
        SUNDAY:    { BREAKFAST: 'Optimization Omelet', LUNCH: 'Recovery Poke Bowl', DINNER: 'Macro-Dense Steak Grid' },
        MONDAY:    { BREAKFAST: 'Nutrient Shake V1', LUNCH: 'Cognitive Salad', DINNER: 'Lean Protein Sync' },
        TUESDAY:   { BREAKFAST: 'Oatmeal Fuel Cell', LUNCH: 'Turkey Spinach Wrap', DINNER: 'Beta-Carotene Chicken' },
        WEDNESDAY: { BREAKFAST: 'Avocado Macro Toast', LUNCH: 'Mediterranean Matrix', DINNER: 'Omega-3 Salmon Filet' },
        THURSDAY:  { BREAKFAST: 'Probiotic Yogurt Array', LUNCH: 'Lentil Broth & Sourdough', DINNER: 'Zucchini Meatball Module' },
        FRIDAY:    { BREAKFAST: 'Peanut Butter Power Shake', LUNCH: 'Quinoa Energy Bowl', DINNER: 'Amino Acid Fajitas' },
        SATURDAY:  { BREAKFAST: 'Protein Pancake Stack', LUNCH: 'Caesar Leaf Protocol', DINNER: 'Thermogenic Beef & Greens' }
    };

    let state = {};
    let completedSet = new Set();
    let clockInterval;

    // ----- INITIALIZATION -----
    function init() {
        console.log("LifeFlux: Initializing...");
        loadState();
        applyTheme();
        startClock();
        
        // Setup Icon Library
        if (window.lucide) {
            lucide.createIcons();
        }

        // Handle Splash
        initSplash();

        // Start Timer Ticker
        setInterval(updateTimers, 1000);

        // Initial Render
        render();
        
        // Auto-save loop
        setInterval(saveState, 5000);
    }

    function initSplash() {
        const profile = state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
        const splashUserEl = document.getElementById('splash-greeting');
        const splashScreen = document.getElementById('splash-screen');
        
        if (splashUserEl) splashUserEl.innerHTML = `Hi! <span style="font-weight: 900;">${profile.name}</span>`;
        
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.visibility = 'hidden';
                    splashScreen.style.display = 'none';
                    if (state.profiles[0].name === "Commander Vector") {
                        openModal('onboarding');
                    }
                }, 800);
            }
        }, 2500);
    }

    // ----- STATE MANAGEMENT -----
    function loadState() {
        const saved = localStorage.getItem('lifeflux_state_v4');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = { ...defaultState, ...parsed };
                completedSet = new Set(parsed.completedIds || []);
            } catch(e) {
                console.error("Error loading state", e);
                state = JSON.parse(JSON.stringify(defaultState));
            }
        } else {
            state = JSON.parse(JSON.stringify(defaultState));
        }
    }

    function saveState() {
        const toSave = { ...state, completedIds: Array.from(completedSet) };
        localStorage.setItem('lifeflux_state_v4', JSON.stringify(toSave));
    }

    function performReset() {
        if(confirm("WARNING: This will wipe all system data. Proceed?")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    // ----- UTILS -----
    function calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let d = now.getDate() - birth.getDate();
        if (d < 0) { months--; d += 30; }
        if (months < 0) { years--; months += 12; }
        return { years, months, days: d };
    }

    function calculateEfficiency() {
        const currentDay = DAYS[new Date().getDay()];
        const tasks = state.fluxTasks.filter(t => t.day === currentDay);
        const total = state.rechargeData.length + tasks.length;
        if (total === 0) return 0;
        const doneProtocols = state.rechargeData.filter(p => p.current >= p.total).length;
        const doneTasks = tasks.filter(t => completedSet.has(t.id)).length;
        return Math.round(((doneProtocols + doneTasks) / total) * 100);
    }

    function startClock() {
        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    }

    function updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('clock');
        if(clockEl) clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        
        const headerDayEl = document.getElementById('header-day');
        if(headerDayEl) headerDayEl.innerText = DAYS[now.getDay()];
        
        // Midnight reset logic
        const todayStr = now.toDateString();
        if (todayStr !== state.lastResetDate) {
            state.history.unshift({ date: state.lastResetDate, efficiency: calculateEfficiency() });
            if(state.history.length > 30) state.history.pop(); // Keep last 30 days
            
            if (state.lives === undefined) state.lives = 5;
            const currentMonth = now.getMonth();
            if (state.lastMonth !== undefined && currentMonth !== state.lastMonth) {
                state.lives = 5;
            }
            state.lastMonth = currentMonth;

            if (!state.dayGoalReached) {
                if (state.lives > 0 && state.currentStreak > 0) {
                    state.lives--;
                } else {
                    state.currentStreak = 0;
                }
            }
            state.dayGoalReached = false;
            
            state.rechargeData.forEach(p => p.current = 0);
            completedSet.clear();
            state.lastResetDate = todayStr;
            saveState();
            render();
        }
    }

    // ----- UI ACTIONS -----
    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
    }

    function applyTheme() {
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        
        if (state.theme === 'dark') {
            document.body.classList.add('theme-dark');
            if(sunIcon) sunIcon.classList.add('hidden');
            if(moonIcon) moonIcon.classList.remove('hidden');
        } else {
            document.body.classList.remove('theme-dark');
            if(sunIcon) sunIcon.classList.remove('hidden');
            if(moonIcon) moonIcon.classList.add('hidden');
        }
    }

    function navigateTo(viewId) {
        state.currentView = viewId;
        // Update DOM classes for views
        document.querySelectorAll('.view').forEach(p => p.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if(targetView) targetView.classList.add('active');
        
        // Hide quick menu if open
        const quickMenu = document.getElementById('quick-menu');
        const plusBtn = document.getElementById('plus-btn');
        if(quickMenu && !quickMenu.classList.contains('hidden')) {
            quickMenu.classList.add('hidden');
            plusBtn.classList.remove('open');
        }

        window.scrollTo(0, 0);
        render();
    }

    function toggleQuickMenu() {
        const menu = document.getElementById('quick-menu');
        const btn = document.getElementById('plus-btn');
        const isHidden = menu.classList.toggle('hidden');
        btn.classList.toggle('open', !isHidden);
    }

    function showToast(message, type="success") {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let icon = type === 'warning' ? 'alert-triangle' : 'zap';
        toast.innerHTML = `<i data-lucide="${icon}" size="16"></i> <span>${message}</span>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        
        // Play premium UI Pop sound
        try {
            if(!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if(window.audioCtx.state === 'suspended') window.audioCtx.resume();
            const osc = window.audioCtx.createOscillator();
            const gain = window.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(window.audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(type === 'success' ? 800 : 300, window.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(type === 'success' ? 400 : 150, window.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, window.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, window.audioCtx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, window.audioCtx.currentTime + 0.15);
            osc.start(window.audioCtx.currentTime);
            osc.stop(window.audioCtx.currentTime + 0.15);
        } catch(e) { console.log('Audio error:', e); }

        setTimeout(() => {
            toast.style.animation = 'slideDownToast 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function playTriumphSound() {
        try {
            if(!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if(window.audioCtx.state === 'suspended') window.audioCtx.resume();
            const osc1 = window.audioCtx.createOscillator();
            const osc2 = window.audioCtx.createOscillator();
            const osc3 = window.audioCtx.createOscillator();
            const gain = window.audioCtx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            osc3.connect(gain);
            gain.connect(window.audioCtx.destination);
            
            osc1.type = 'sine'; osc2.type = 'triangle'; osc3.type = 'sine';
            
            const t = window.audioCtx.currentTime;
            osc1.frequency.setValueAtTime(523.25, t); // C5
            osc2.frequency.setValueAtTime(659.25, t + 0.1); // E5
            osc3.frequency.setValueAtTime(783.99, t + 0.2); // G5
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
            gain.gain.setValueAtTime(0.15, t + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
            
            osc1.start(t);
            osc2.start(t + 0.1);
            osc3.start(t + 0.2);
            osc1.stop(t + 0.8);
            osc2.stop(t + 0.8);
            osc3.stop(t + 0.8);
        } catch(e) { console.log('Triumph audio error:', e); }
    }

    // ----- ENTITY HANDLERS -----
    function checkGoalReached() {
        if (state.lives === undefined) state.lives = 5;
        const currentDay = DAYS[new Date().getDay()];
        const tasks = state.fluxTasks.filter(t => t.day === currentDay);
        const total = state.rechargeData.length + tasks.length;
        if (total === 0) return;
        const doneProtocols = state.rechargeData.filter(p => p.current >= p.total).length;
        const doneTasks = tasks.filter(t => completedSet.has(t.id)).length;
        const completed = doneProtocols + doneTasks;

        const eff = calculateEfficiency();
        if (eff === 100) {
            if (!state.dayGoalReached) {
                state.dayGoalReached = true;
                state.currentStreak = (state.currentStreak || 0) + 1;
                if (state.currentStreak % 7 === 0 && state.lives < 5) state.lives++;
                if (window.confetti) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00ffcc', '#6366f1', '#f43f5e'] });
                }
                playTriumphSound();
                saveState();
            }
        } else {
            if (state.dayGoalReached) {
                state.dayGoalReached = false;
                state.currentStreak = Math.max(0, (state.currentStreak || 0) - 1);
                saveState();
            }
            if (completed === total - 1) {
                if (!state.almostDoneNotified) {
                    showToast("Only 1 objective left to add one streak! 🔥", "success");
                    state.almostDoneNotified = true;
                    saveState();
                }
            } else {
                if (state.almostDoneNotified) {
                    state.almostDoneNotified = false;
                    saveState();
                }
            }
        }
    }

    function handleTaskToggle(id) {
        if (completedSet.has(id)) completedSet.delete(id);
        else completedSet.add(id);
        checkGoalReached();
        render();
    }

    function handleProtocolIncrement(id) {
        const p = state.rechargeData.find(x => x.id === id);
        if (p && p.current < p.total) {
            p.current++;
            checkGoalReached();
            render();
        }
    }

    function toggleProtocolTimer(protoId, event) {
        event.stopPropagation();
        const p = state.rechargeData.find(x => x.id === protoId);
        if (!p || !p.hasTimer) return;
        
        p.isRunning = !p.isRunning;
        render();
    }

    function resetProtocolTimer(protoId, event) {
        event.stopPropagation();
        const p = state.rechargeData.find(x => x.id === protoId);
        if (!p || !p.hasTimer) return;
        
        p.isRunning = false;
        p.remaining = p.duration * 60;
        render();
    }

    function updateTimers() {
        let changed = false;
        state.rechargeData.forEach(p => {
            if (p.hasTimer && p.isRunning && p.current < p.total) {
                if (p.remaining > 0) {
                    p.remaining--;
                    changed = true;
                } else {
                    p.isRunning = false;
                    p.remaining = p.duration * 60; // Reset for next iteration
                    p.current++;
                    changed = true;
                    showToast(`Protocol complete: ${p.label}`, 'success');
                    playTriumphSound();
                    checkGoalReached();
                }
            }
        });
        if (changed) render();
    }
    
    function removeProtocol(id, event) {
        event.stopPropagation();
        if(confirm("Remove this protocol?")) {
            state.rechargeData = state.rechargeData.filter(p => p.id !== id);
            render();
        }
    }

    function removeTask(id, event) {
        event.stopPropagation();
        if(confirm("Remove this objective?")) {
            state.fluxTasks = state.fluxTasks.filter(t => t.id !== id);
            render();
        }
    }

    function switchProfile(profileId) {
        state.activeProfileId = profileId;
        render();
    }

    function deleteActiveProfile() {
        if (state.profiles.length <= 1) return alert("Requires at least one primary profile.");
        if(confirm("Confirm profile deletion?")) {
            state.profiles = state.profiles.filter(p => p.id !== state.activeProfileId);
            state.activeProfileId = state.profiles[0].id;
            render();
        }
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const profile = state.profiles.find(p => p.id === state.activeProfileId);
                profile.avatar = event.target.result;
                render();
            };
            reader.readAsDataURL(file);
        }
    }

    // ----- MODAL SYSTEM -----
    function openModal(type, payload = null) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        let title = type.replace('_', ' ');
        let bodyHtml = '';

        if (type === 'add_task') {
            title = 'New Objective';
            bodyHtml = `
                <div class="modal-body">
                    <input id="input-task" placeholder="Objective Designation" autofocus>
                    <div class="input-group">
                        <input id="input-time-raw" placeholder="12:00" style="flex:1;">
                        <div class="am-pm-toggle">
                            <button id="am-toggle" onclick="app.setAMPM('AM')" class="am-pm-btn active">AM</button>
                            <button id="pm-toggle" onclick="app.setAMPM('PM')" class="am-pm-btn">PM</button>
                        </div>
                    </div>
                    <input type="hidden" id="selected-ampm" value="AM">
                    <button onclick="app.saveTask()" class="btn primary mt-4">Initialize</button>
                </div>`;
        } else if (type === 'add_protocol') {
            title = 'New Protocol';
            bodyHtml = `
                <div class="modal-body">
                    <input id="input-label" placeholder="Protocol Designation" autofocus>
                    <div class="input-group">
                        <label>Iterations</label>
                        <input id="input-total" type="number" value="1" min="1" style="flex:1;">
                    </div>

                    <div class="mt-4" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.25rem; border-top: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">
                            <i data-lucide="timer" size="16"></i>
                            <span>ENABLE TIMER</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="timer-toggle-proto" onchange="document.getElementById('duration-row-proto').style.display = this.checked ? 'flex' : 'none'">
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div id="duration-row-proto" class="input-row mt-2" style="display: none;">
                        <label style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Duration (Minutes)</label>
                        <input id="input-duration-proto" type="number" value="15" min="1" max="180">
                    </div>

                    <button onclick="app.saveProtocol()" class="btn primary mt-4">Apply</button>
                </div>`;
        } else if (type === 'factory_reset') {
            title = 'System Wipe';
            bodyHtml = `
                <div class="modal-body text-center" style="text-align: center;">
                    <i data-lucide="alert-triangle" size="48" style="color: var(--danger); margin: 0 auto 1rem;"></i>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.8rem; line-height: 1.5;">All local databanks will be purged permanently. This action cannot be undone.</p>
                    <button onclick="app.performReset()" class="btn danger">Confirm Purge</button>
                </div>`;
        } else if (type === 'edit_profile') {
            title = 'Update Profile';
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
            bodyHtml = `
                <div class="modal-body">
                    <div class="input-row"><label>Designation</label><input id="input-name" value="${profile.name}"></div>
                    <div class="input-row"><label>Origin Date</label><input id="input-birth" type="date" value="${profile.birthdate}"></div>
                    <button onclick="app.saveProfile()" class="btn primary mt-4">Sync Network</button>
                </div>`;
        } else if (type === 'add_profile') {
            title = 'Generate Profile';
            bodyHtml = `
                <div class="modal-body">
                    <div class="input-row"><label>Designation</label><input id="new-profile-name" placeholder="Agent Name"></div>
                    <div class="input-row"><label>Origin Date</label><input id="new-profile-birth" type="date" value="2000-01-01"></div>
                    <button onclick="app.saveNewProfile()" class="btn primary mt-4">Create</button>
                </div>`;
        } else if (type === 'edit_blueprint') {
            title = `${payload} Payload`;
            const dayPlan = state.weeklyPlan[payload];
            bodyHtml = `
                <div class="modal-body">
                    <div class="input-row"><label>1. Breakfast</label><input id="input-b" value="${dayPlan.BREAKFAST}"></div>
                    <div class="input-row"><label>2. Lunch</label><input id="input-l" value="${dayPlan.LUNCH}"></div>
                    <div class="input-row"><label>3. Dinner</label><input id="input-d" value="${dayPlan.DINNER}"></div>
                    <button onclick="app.saveBlueprint('${payload}')" class="btn primary mt-4">Update Architecture</button>
                </div>`;
        } else if (type === 'onboarding') {
            title = 'INITIALIZE COMMANDER';
            bodyHtml = `
                <div class="modal-body">
                    <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.75rem;">Please set your credentials to synchronize the command center.</p>
                    <div class="input-row"><label>Designation (Name)</label><input id="onboard-name" placeholder="Your Name" autofocus></div>
                    <div class="input-row"><label>Origin Date (Birthdate)</label><input id="onboard-birth" type="date" value="2000-01-01"></div>
                    <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); padding: 1rem; border-radius: var(--radius-md); margin-top: 1rem;">
                        <p style="font-size: 0.75rem; color: var(--text-main); font-weight: 600; line-height: 1.5; text-align: justify;">LifeFlux is a high-performance system engineered to track your vital protocols, optimize nutrition, and build unbreakable momentum. To maintain your Failsafe Shields, absolutely perfect discipline is required. Do you accept the challenge?</p>
                    </div>
                    <button onclick="app.saveOnboarding()" class="btn primary mt-4">Start System</button>
                </div>`;
        } else if (type === 'manual') {
            title = 'SYSTEM MANUAL';
            bodyHtml = `
                <div class="modal-body" style="font-size: 0.75rem; line-height: 1.6; color: var(--text-main);">
                    <h3 style="color: var(--accent); margin-bottom: 0.5rem; font-size: 0.85rem; display: flex; align-items: center;"><i data-lucide="target" size="14" style="margin-right: 4px;"></i> THE OBJECTIVE</h3>
                    <p style="margin-bottom: 1rem;">LifeFlux is engineered to gamify and track your daily discipline. Complete 100% of your tasks and protocols before midnight every day to build your streak.</p>
                    
                    <h3 style="color: #ff9100; margin-bottom: 0.5rem; font-size: 0.85rem; display: flex; align-items: center;"><i data-lucide="flame" size="14" style="margin-right: 4px;"></i> STREAK SYSTEM</h3>
                    <p style="margin-bottom: 1rem;">Core Efficiency must reach 100% daily. Securing 100% efficiency adds to your Streak. Failing a day endangers your progress.</p>
                    
                    <h3 style="color: #f43f5e; margin-bottom: 0.5rem; font-size: 0.85rem; display: flex; align-items: center;"><i data-lucide="shield" size="14" style="margin-right: 4px;"></i> FAILSAFE SHIELDS</h3>
                    <p style="margin-bottom: 1.5rem;">You are granted 5 Failsafe Shields strictly per month. Missing a day consumes a shield instead of destroying your streak. If all shields hit 0, your streak breaks entirely. A flawless 7-day streak regenerates 1 shield.</p>
                    
                    <button onclick="app.closeModal()" class="btn primary">Acknowledge</button>
                </div>`;
        } else if (type === 'streak_message') {
            title = 'STREAK STATUS';
            const currentLives = state.lives !== undefined ? state.lives : 5;
            bodyHtml = `
                <div class="modal-body" style="text-align: center;">
                    <i data-lucide="flame" size="48" style="color: #ff9100; margin: 0 auto 1rem; display: block;"></i>
                    <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-main);">
                        You have completed ${state.currentStreak || 0} consecutive day${(state.currentStreak || 0) === 1 ? '' : 's'} of tasks!
                    </p>
                    <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 0.5rem; line-height: 1.5;">Maintain 100% Core Efficiency daily to keep your discipline streak alive.</p>
                    <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); padding: 0.5rem; border-radius: 8px; margin-bottom: 1.5rem; display: inline-block;">
                        <span style="color: #f43f5e; font-weight: bold; font-size: 0.9rem;"><i data-lucide="shield" size="14" style="margin-right:4px;"></i> Failsafe Shields: ${currentLives}/5</span>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Lose a shield instead of your streak for missed days.</p>
                    </div>
                    <br>
                    <button onclick="app.closeModal()" class="btn primary">Acknowledge</button>
                </div>`;
        }

        let closeBtn = type === 'onboarding' ? '' : '<button onclick="app.closeModal()" class="icon-btn-small"><i data-lucide="x" size="20"></i></button>';
        content.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                ${closeBtn}
            </div>
            ${bodyHtml}
        `;
        
        if (window.lucide) lucide.createIcons();
        overlay.classList.add('active');
        
        // Hide quick menu if closing modal from fab
        document.getElementById('quick-menu')?.classList.add('hidden');
        document.getElementById('plus-btn')?.classList.remove('open');
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    function setAMPM(val) {
        document.getElementById('selected-ampm').value = val;
        document.getElementById('am-toggle').className = val === 'AM' ? 'am-pm-btn active' : 'am-pm-btn';
        document.getElementById('pm-toggle').className = val === 'PM' ? 'am-pm-btn active' : 'am-pm-btn';
    }

    function saveTask() {
        const task = document.getElementById('input-task').value;
        const timeRaw = document.getElementById('input-time-raw').value || '12:00';
        const ampm = document.getElementById('selected-ampm').value;
        if(!task) return;
        
        const time = `${timeRaw} ${ampm}`;
        state.fluxTasks.push({ id: 't-' + Date.now(), task, time, day: state.selectedDay });
        closeModal();
        render();
    }

    function saveProtocol() {
        const label = document.getElementById('input-label').value;
        const total = parseInt(document.getElementById('input-total').value);
        const hasTimer = document.getElementById('timer-toggle-proto').checked;
        const durationMins = parseInt(document.getElementById('input-duration-proto').value) || 15;

        if(!label) return;
        state.rechargeData.push({ 
            id: 'p-' + Date.now(), 
            label: label.toUpperCase(), 
            current: 0, 
            total: total || 1,
            hasTimer,
            duration: durationMins,
            remaining: durationMins * 60,
            isRunning: false
        });
        closeModal();
        render();
    }

    function saveProfile() {
        const name = document.getElementById('input-name').value;
        const birth = document.getElementById('input-birth').value;
        const profile = state.profiles.find(p => p.id === state.activeProfileId);
        profile.name = name || profile.name;
        profile.birthdate = birth || profile.birthdate;
        closeModal();
        render();
    }

    function saveNewProfile() {
        const name = document.getElementById('new-profile-name').value;
        const birth = document.getElementById('new-profile-birth').value;
        if(!name) return;
        const id = 'prf-' + Date.now();
        state.profiles.push({ id, name, birthdate: birth, avatar: null });
        state.activeProfileId = id;
        closeModal();
        render();
    }

    function saveBlueprint(day) {
        state.weeklyPlan[day].BREAKFAST = document.getElementById('input-b').value;
        state.weeklyPlan[day].LUNCH = document.getElementById('input-l').value;
        state.weeklyPlan[day].DINNER = document.getElementById('input-d').value;
        closeModal();
        render();
    }

    function saveOnboarding() {
        const name = document.getElementById('onboard-name').value;
        const birth = document.getElementById('onboard-birth').value;
        if(!name) return alert("System requires a Designation to proceed.");
        const profile = state.profiles.find(p => p.id === state.activeProfileId);
        profile.name = name;
        profile.birthdate = birth || profile.birthdate;
        closeModal();
        saveState();
        render();
    }

    // ----- RENDER LOOP -----
    function render() {
        const profile = state.profiles.find(p => p.id === state.activeProfileId) || state.profiles[0];
        
        // Global User Details
        const greetingEl = document.getElementById('user-greeting');
        if(greetingEl) greetingEl.innerText = profile.name.split(' ')[0];
        
        const nameSmallEl = document.getElementById('user-name-small');
        if(nameSmallEl) nameSmallEl.innerText = profile.name;
        
        const avatarSmallEl = document.getElementById('user-avatar-small');
        if(avatarSmallEl) {
            avatarSmallEl.innerHTML = profile.avatar 
                ? `<img src="${profile.avatar}" alt="Avatar">` 
                : profile.name[0];
        }

        // Navigation state syncing
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const id = btn.id.replace('nav-', '');
            btn.classList.toggle('active', state.currentView === id);
        });

        // VIEW RENDERING
        if (state.currentView === 'DASHBOARD') {
            renderDashboard(profile);
        } else if (state.currentView === 'WEEKLY_ARCHITECTURE') {
            renderWeekly();
        } else if (state.currentView === 'HISTORY') {
            renderHistory();
        } else if (state.currentView === 'PROFILE') {
            renderProfile(profile);
        }

        if (window.lucide) lucide.createIcons();
    }

    function renderDashboard(profile) {
        // Warning Banner
        const notificationBanner = document.getElementById('warning-banner');
        if (notificationBanner) {
            const now = new Date();
            // Show warning if after 8PM and day goal not reached
            if (now.getHours() >= 20 && !state.dayGoalReached && state.currentStreak > 0) {
                notificationBanner.style.display = 'flex';
            } else {
                notificationBanner.style.display = 'none';
            }
        }

        // Day Selector
        const ds = document.getElementById('day-selector');
        if(ds) {
            const today = DAYS[new Date().getDay()];
            ds.innerHTML = DAYS.map(d => `
                <button onclick="app.setSelectedDay('${d}')" class="day-btn ${state.selectedDay === d ? 'active' : ''} ${d === today ? 'today' : ''}">
                    ${d.slice(0,3)}
                </button>
            `).join('');
        }

        // Efficiency
        const eff = calculateEfficiency();
        const effVal = document.getElementById('efficiency-value');
        const effBar = document.getElementById('efficiency-bar');
        if(effVal) effVal.innerText = eff + '%';
        if(effBar) effBar.style.width = eff + '%';

        const streakBadge = document.getElementById('streak-badge');
        const streakCount = document.getElementById('streak-count');
        if (streakBadge && streakCount) {
            if ((state.currentStreak || 0) > 0) {
                streakBadge.style.display = 'flex';
                streakCount.innerText = state.currentStreak;
            } else {
                streakBadge.style.display = 'none';
            }
        }
        
        const livesCount = document.getElementById('lives-count');
        if (livesCount) {
            livesCount.innerText = state.lives !== undefined ? state.lives : 5;
        }

        // Nutrition
        const mp = document.getElementById('mini-meal-plan');
        const dayPlan = state.weeklyPlan[state.selectedDay];
        if(mp) {
            mp.innerHTML = `
                <div class="meal-row"><span class="meal-label">1. Breakfast</span><span class="meal-desc truncate" title="${dayPlan.BREAKFAST}">${dayPlan.BREAKFAST}</span></div>
                <div class="meal-row"><span class="meal-label">2. Lunch</span><span class="meal-desc truncate" title="${dayPlan.LUNCH}">${dayPlan.LUNCH}</span></div>
                <div class="meal-row" style="margin-bottom:0;"><span class="meal-label">3. Dinner</span><span class="meal-desc truncate" title="${dayPlan.DINNER}">${dayPlan.DINNER}</span></div>
            `;
        }

        // Tasks / Objectives
        const tl = document.getElementById('timeline-list');
        const filteredTasks = state.fluxTasks.filter(t => t.day === state.selectedDay);
        if(tl) {
            if(filteredTasks.length === 0) {
                tl.innerHTML = '<div class="empty-state">No active objectives detected.</div>';
            } else {
                tl.innerHTML = filteredTasks.map(t => {
                    const isDone = completedSet.has(t.id);
                    return `
                        <div class="task-item ${isDone ? 'done' : ''}">
                            <button onclick="app.handleTaskToggle('${t.id}')" class="task-toggle" aria-label="Toggle Complete">
                                <i data-lucide="check" size="14"></i>
                            </button>
                            <div class="task-content">
                                <p class="task-time">${t.time}</p>
                                <p class="task-name">${t.task}</p>
                            </div>
                            <button onclick="app.removeTask('${t.id}', event)" class="task-delete" aria-label="Remove Task">
                                <i data-lucide="trash-2" size="14"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }

        // Protocols
        const pg = document.getElementById('protocol-grid');
        if(pg) {
            pg.innerHTML = state.rechargeData.map(p => `
                <div onclick="app.handleProtocolIncrement('${p.id}')" class="protocol-card ${p.hasTimer && p.isRunning ? 'timer-active' : ''}" aria-label="Increment Protocol">
                    <button onclick="app.removeProtocol('${p.id}', event)" class="protocol-delete" aria-label="Remove Protocol">
                        <i data-lucide="x" size="12"></i>
                    </button>
                    <p class="protocol-label">${p.label}</p>
                    <p class="protocol-progress">${p.current}/${p.total}</p>
                    <div class="protocol-track">
                        <div class="protocol-fill" style="width: ${(p.current/p.total)*100}%"></div>
                    </div>
                </div>
            `).join('');
        }

        renderActiveTickers();
    }

    function renderActiveTickers() {
        const container = document.getElementById('active-tickers-section');
        if(!container) return;
        
        const protocolsWithTimers = state.rechargeData.filter(p => p.hasTimer && p.current < p.total);
        if(protocolsWithTimers.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <h3 class="card-subtitle mb-4">ACTIVE TELEMETRY</h3>
            <div class="tickers-grid">
                ${protocolsWithTimers.map(p => {
                    const m = Math.floor(p.remaining / 60);
                    const s = p.remaining % 60;
                    const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
                    const progress = ((p.duration * 60 - p.remaining) / (p.duration * 60)) * 100;
                    
                    return `
                        <div class="ticker-card ${p.isRunning ? 'active' : ''}">
                            <div class="ticker-header">
                                <span class="ticker-label">${p.label} synchronization in progress...</span>
                                <div class="ticker-controls">
                                    <button onclick="app.toggleProtocolTimer('${p.id}', event)" class="ticker-btn main">
                                        <i data-lucide="${p.isRunning ? 'pause' : 'play'}" size="14"></i>
                                    </button>
                                    <button onclick="app.resetProtocolTimer('${p.id}', event)" class="ticker-btn">
                                        <i data-lucide="rotate-ccw" size="14"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="ticker-display">${timeStr}</div>
                            <div class="ticker-track">
                                <div class="ticker-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    function renderWeekly() {
        const grid = document.getElementById('full-weekly-grid');
        if(grid) {
            grid.innerHTML = DAYS.map(d => {
                const plan = state.weeklyPlan[d];
                return `
                <div class="day-card">
                    <button onclick="app.openModal('edit_blueprint', '${d}')" class="icon-btn-small day-card-edit"><i data-lucide="edit-3" size="14"></i></button>
                    <h4>${d}</h4>
                    <div class="day-card-item"><label>1. Breakfast</label><span class="truncate block">${plan.BREAKFAST}</span></div>
                    <div class="day-card-item"><label>2. Lunch</label><span class="truncate block">${plan.LUNCH}</span></div>
                    <div class="day-card-item"><label>3. Dinner</label><span class="truncate block">${plan.DINNER}</span></div>
                </div>`;
            }).join('');
        }
    }

    function renderHistory() {
        const hl = document.getElementById('history-list');
        if(hl) {
            if(state.history.length === 0) {
                hl.innerHTML = '<div class="empty-state">No archived telemetry found.</div>';
            } else {
                hl.innerHTML = state.history.map(h => `
                    <div class="history-item">
                        <span class="history-date">${h.date}</span>
                        <span class="history-score">${h.efficiency}%</span>
                    </div>
                `).join('');
            }
        }
    }

    function renderProfile(profile) {
        // Profile List
        const ps = document.getElementById('profile-selector-list');
        if(ps) {
            ps.innerHTML = state.profiles.map(p => `
                <div onclick="app.switchProfile('${p.id}')" class="profile-item ${state.activeProfileId === p.id ? 'active' : ''}">
                    <div class="profile-item-avatar">
                        ${p.avatar ? `<img src="${p.avatar}">` : p.name[0]}
                    </div>
                    <span class="profile-item-name">${p.name}</span>
                    ${state.activeProfileId === p.id ? '<i data-lucide="check-circle" size="18" class="accent"></i>' : ''}
                </div>
            `).join('');
        }

        // Details Panel
        const age = calculateAge(profile.birthdate);
        
        const avatarLargeEl = document.getElementById('profile-avatar-large');
        if(avatarLargeEl) {
            avatarLargeEl.innerHTML = profile.avatar ? `<img src="${profile.avatar}">` : profile.name[0];
        }
        
        const nameLargeEl = document.getElementById('profile-name-large');
        if(nameLargeEl) nameLargeEl.innerText = profile.name;

        const ageStatsEl = document.getElementById('age-stats');
        if(ageStatsEl) {
            ageStatsEl.innerHTML = `
                <div class="stat-box"><p class="stat-label">Years</p><p class="stat-value">${age.years}</p></div>
                <div class="stat-box"><p class="stat-label">Months</p><p class="stat-value">${age.months}</p></div>
                <div class="stat-box"><p class="stat-label">Days</p><p class="stat-value">${age.days}</p></div>
            `;
        }

        const deleteBtn = document.getElementById('delete-profile-btn');
        if(deleteBtn) {
            deleteBtn.classList.toggle('hidden', state.profiles.length <= 1);
        }
    }

    function setSelectedDay(d) {
        state.selectedDay = d;
        render();
    }

    // Initialize on DOM load
    window.addEventListener('DOMContentLoaded', init);

    // Export public API
    return {
        get state() { return state; },
        toggleTheme, navigateTo, toggleQuickMenu, 
        handleTaskToggle, handleProtocolIncrement, toggleProtocolTimer, resetProtocolTimer, removeProtocol, removeTask,
        openModal, closeModal, setAMPM, saveTask, saveProtocol,
        saveProfile, saveNewProfile, saveBlueprint, saveOnboarding, performReset,
        handleAvatarUpload, switchProfile, deleteActiveProfile,
        setSelectedDay, renderActiveTickers
    };
})();
