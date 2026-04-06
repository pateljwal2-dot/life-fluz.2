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
            
            if (!state.dayGoalReached) {
                state.currentStreak = 0;
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

    // ----- ENTITY HANDLERS -----
    function checkGoalReached() {
        const eff = calculateEfficiency();
        if (eff === 100) {
            if (!state.dayGoalReached) {
                state.dayGoalReached = true;
                state.currentStreak = (state.currentStreak || 0) + 1;
                if (window.confetti) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00ffcc', '#6366f1', '#ffffff'] });
                }
                saveState();
            }
        } else {
            if (state.dayGoalReached) {
                state.dayGoalReached = false;
                state.currentStreak = Math.max(0, (state.currentStreak || 0) - 1);
                saveState();
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
    
    function removeProtocol(id, event) {
        event.stopPropagation();
        if(confirm("Remove this protocol?")) {
            state.rechargeData = state.rechargeData.filter(p => p.id !== id);
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
                    <div class="input-row"><label>Phase 1 (Breakfast)</label><input id="input-b" value="${dayPlan.BREAKFAST}"></div>
                    <div class="input-row"><label>Phase 2 (Lunch)</label><input id="input-l" value="${dayPlan.LUNCH}"></div>
                    <div class="input-row"><label>Phase 3 (Dinner)</label><input id="input-d" value="${dayPlan.DINNER}"></div>
                    <button onclick="app.saveBlueprint('${payload}')" class="btn primary mt-4">Update Architecture</button>
                </div>`;
        } else if (type === 'onboarding') {
            title = 'INITIALIZE COMMANDER';
            bodyHtml = `
                <div class="modal-body">
                    <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.75rem;">Welcome to LifeFlux. Please set your credentials to synchronize the command center.</p>
                    <div class="input-row"><label>Designation (Name)</label><input id="onboard-name" placeholder="Your Name" autofocus></div>
                    <div class="input-row"><label>Origin Date (Birthdate)</label><input id="onboard-birth" type="date" value="2000-01-01"></div>
                    <button onclick="app.saveOnboarding()" class="btn primary mt-4">Start System</button>
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
        if(!label) return;
        state.rechargeData.push({ id: 'p-' + Date.now(), label: label.toUpperCase(), current: 0, total: total || 1 });
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

        // Nutrition
        const mp = document.getElementById('mini-meal-plan');
        const dayPlan = state.weeklyPlan[state.selectedDay];
        if(mp) {
            mp.innerHTML = `
                <div class="meal-row"><span class="meal-label">Phase 1</span><span class="meal-desc truncate" title="${dayPlan.BREAKFAST}">${dayPlan.BREAKFAST}</span></div>
                <div class="meal-row"><span class="meal-label">Phase 2</span><span class="meal-desc truncate" title="${dayPlan.LUNCH}">${dayPlan.LUNCH}</span></div>
                <div class="meal-row" style="margin-bottom:0;"><span class="meal-label">Phase 3</span><span class="meal-desc truncate" title="${dayPlan.DINNER}">${dayPlan.DINNER}</span></div>
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
                        </div>
                    `;
                }).join('');
            }
        }

        // Protocols
        const pg = document.getElementById('protocol-grid');
        if(pg) {
            pg.innerHTML = state.rechargeData.map(p => `
                <div onclick="app.handleProtocolIncrement('${p.id}')" class="protocol-card" aria-label="Increment Protocol">
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
                    <div class="day-card-item"><label>Phase 1</label><span class="truncate block">${plan.BREAKFAST}</span></div>
                    <div class="day-card-item"><label>Phase 2</label><span class="truncate block">${plan.LUNCH}</span></div>
                    <div class="day-card-item"><label>Phase 3</label><span class="truncate block">${plan.DINNER}</span></div>
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
        handleTaskToggle, handleProtocolIncrement, removeProtocol,
        openModal, closeModal, setAMPM, saveTask, saveProtocol,
        saveProfile, saveNewProfile, saveBlueprint, saveOnboarding, performReset,
        handleAvatarUpload, switchProfile, deleteActiveProfile,
        setSelectedDay
    };
})();
