const STORAGE_KEY = 'habit_tracker_data';

// --- Data Management ---
const DataManager = {
    getData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { habits: [] };
        } catch {
            return { habits: [] };
        }
    },
    saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    addHabit(name) {
        const data = this.getData();
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            created: new Date().toISOString(),
            tracking: {}
        };
        data.habits.push(newHabit);
        this.saveData(data);
        return newHabit;
    },
    trackDay(habitId, dateStr, isCompleted) {
        const data = this.getData();
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.tracking[dateStr] = isCompleted;
            this.saveData(data);
        }
    },
    getHabit(habitId) {
        return this.getData().habits.find(h => h.id === habitId);
    }
};

// --- Utilities ---
const Utils = {
    getTodayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    calculateStreak(habit) {
        if (!habit || !habit.tracking) return { years: 0, months: 0, days: 0 };
        const dates = Object.keys(habit.tracking)
            .filter(d => habit.tracking[d] === true)
            .sort((a, b) => new Date(b) - new Date(a));
        
        if (dates.length === 0) return { years: 0, months: 0, days: 0 };

        let currentStreak = 0;
        let today = new Date(this.getTodayStr());
        
        let firstDateToCheck = new Date(dates[0]);
        let diffTime = Math.abs(today - firstDateToCheck);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            return { years: 0, months: 0, days: 0, total: 0 }; 
        }

        let lastDate = new Date(dates[0]);
        currentStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            let d = new Date(dates[i]);
            let diff = Math.round((lastDate - d) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                currentStreak++;
                lastDate = d;
            } else {
                break;
            }
        }

        let years = Math.floor(currentStreak / 365);
        let remaining = currentStreak % 365;
        let months = Math.floor(remaining / 30);
        let days = remaining % 30;

        return { years, months, days, total: currentStreak };
    },
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }
};

// --- UI Management ---
const App = {
    currentHabitIndex: 0,
    
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderMainView();
    },
    
    cacheDOM() {
        this.mainView = document.getElementById('main-view');
        this.createView = document.getElementById('create-view');
        this.settingsView = document.getElementById('settings-view');
        this.cardContainer = document.getElementById('card-container');
        this.sessionControls = document.getElementById('session-controls');
        
        this.btnSettings = document.getElementById('btn-settings');
        this.btnBackCreate = document.getElementById('btn-back-create');
        this.btnBackSettings = document.getElementById('btn-back-settings');
        
        this.habitNameInput = document.getElementById('habit-name');
        this.btnSaveHabit = document.getElementById('btn-save-habit');
        
        this.btnYes = document.getElementById('btn-yes');
        this.btnNo = document.getElementById('btn-no');
        
        this.btnExport = document.getElementById('btn-export');
        this.btnImportTrigger = document.getElementById('btn-import-trigger');
        this.fileImport = document.getElementById('file-import');

        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
    },
    
    bindEvents() {
        this.btnSettings.addEventListener('click', () => this.switchView(this.settingsView));
        this.btnBackCreate.addEventListener('click', () => {
            // When going back, make sure we stay at the end if we were creating
            const maxIndex = DataManager.getData().habits.length;
            if(this.currentHabitIndex > maxIndex) {
                this.currentHabitIndex = maxIndex;
            }
            this.switchView(this.mainView);
            this.renderMainView();
        });
        this.btnBackSettings.addEventListener('click', () => this.switchView(this.mainView));
        
        this.btnSaveHabit.addEventListener('click', () => {
            const name = this.habitNameInput.value.trim();
            if (name) {
                DataManager.addHabit(name);
                this.habitNameInput.value = '';
                this.currentHabitIndex = DataManager.getData().habits.length - 1;
                this.switchView(this.mainView);
                this.renderMainView();
            }
        });

        this.btnYes.addEventListener('click', () => this.trackToday(true));
        this.btnNo.addEventListener('click', () => this.trackToday(false));
        
        this.btnExport.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DataManager.getData()));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "habit_tracker_backup.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

        this.btnImportTrigger.addEventListener('click', () => this.fileImport.click());
        this.fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data && data.habits) {
                            DataManager.saveData(data);
                            this.currentHabitIndex = 0;
                            this.renderMainView();
                            alert("Data imported successfully!");
                        }
                    } catch(err) {
                        alert("Invalid file format.");
                    }
                };
                reader.readAsText(file);
            }
        });

        this.btnPrev.addEventListener('click', () => this.navigate(-1));
        this.btnNext.addEventListener('click', () => this.navigate(1));

        // Swipe handling
        let touchstartX = 0;
        let touchendX = 0;
        this.cardContainer.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        });
        this.cardContainer.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    },

    navigate(dir) {
        const habits = DataManager.getData().habits;
        // max index is habits.length (the "Start new habit" card)
        const maxIndex = habits.length;
        
        let newIndex = this.currentHabitIndex + dir;
        if (newIndex >= 0 && newIndex <= maxIndex) {
            this.currentHabitIndex = newIndex;
            this.renderMainView();
        }
    },

    handleSwipe() {
        const threshold = 50;
        if (touchendX < touchstartX - threshold) {
            this.navigate(1); // swipe left = next
        }
        if (touchendX > touchstartX + threshold) {
            this.navigate(-1); // swipe right = prev
        }
    },

    switchView(view) {
        [this.mainView, this.createView, this.settingsView].forEach(v => v.classList.add('hidden'));
        view.classList.remove('hidden');
    },

    trackToday(isCompleted) {
        const habits = DataManager.getData().habits;
        if (habits.length > 0 && this.currentHabitIndex < habits.length) {
            const currentHabit = habits[this.currentHabitIndex];
            DataManager.trackDay(currentHabit.id, Utils.getTodayStr(), isCompleted);
            this.renderMainView(); 
        }
    },

    renderCalendar(habit) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = Utils.getDaysInMonth(year, month);
        const firstDay = Utils.getFirstDayOfMonth(year, month);
        const todayStr = Utils.getTodayStr();

        let html = `<div class="calendar-grid">`;
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(d => html += `<div class="cal-header">${d}</div>`);
        
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="cal-cell empty"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let classes = ['cal-cell'];
            if (habit && habit.tracking && habit.tracking[dStr] === true) classes.push('cal-done');
            else if (habit && habit.tracking && habit.tracking[dStr] === false) classes.push('cal-missed');
            if (dStr === todayStr) classes.push('cal-today');

            html += `<div class="${classes.join(' ')}">${day}</div>`;
        }
        html += `</div>`;
        return html;
    },

    renderMainView() {
        const data = DataManager.getData();
        this.cardContainer.innerHTML = '';
        
        const maxIndex = data.habits.length; // max index is the empty state card

        if (this.currentHabitIndex > maxIndex) {
            this.currentHabitIndex = maxIndex;
        }

        // Show/Hide arrows
        if (this.currentHabitIndex === 0) {
            this.btnPrev.classList.add('invisible');
        } else {
            this.btnPrev.classList.remove('invisible');
        }

        if (this.currentHabitIndex === maxIndex) {
            this.btnNext.classList.add('invisible');
        } else {
            this.btnNext.classList.remove('invisible');
        }
        
        if (this.currentHabitIndex === maxIndex) {
            // Render "Start a new habit" card
            this.sessionControls.classList.add('invisible');
            const card = document.createElement('div');
            card.className = 'habit-card empty-habit';
            card.innerHTML = `
                <div>Start a new habit</div>
                <div style="font-size: 48px; margin-top: 10px;">+</div>
            `;
            card.addEventListener('click', () => {
                this.habitNameInput.value = ''; // clear previous input
                this.switchView(this.createView);
            });
            this.cardContainer.appendChild(card);
            return;
        }

        // Render actual habit card
        const habit = data.habits[this.currentHabitIndex];
        const streak = Utils.calculateStreak(habit);
        const todayStr = Utils.getTodayStr();
        const todayTracked = habit.tracking[todayStr] !== undefined;

        let streakText = '';
        if (streak.years > 0) streakText += `${streak.years}y `;
        if (streak.months > 0) streakText += `${streak.months}m `;
        streakText += `${streak.days}d`;
        if(streak.total === 0) streakText = "0 days";

        const card = document.createElement('div');
        card.className = 'habit-card';
        card.innerHTML = `
            <div class="habit-title">${habit.name}</div>
            <div class="habit-streak">Streak: ${streakText}</div>
            <div class="habit-calendar">${this.renderCalendar(habit)}</div>
        `;
        this.cardContainer.appendChild(card);

        this.sessionControls.classList.remove('invisible');
        
        // Highlight active button if already tracked today
        this.btnYes.style.opacity = (todayTracked && habit.tracking[todayStr] === true) ? '1' : (todayTracked ? '0.3' : '1');
        this.btnNo.style.opacity = (todayTracked && habit.tracking[todayStr] === false) ? '1' : (todayTracked ? '0.3' : '1');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}
