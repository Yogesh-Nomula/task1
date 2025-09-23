// EcoHero - Daily Green Score Tracker
class EcoHero {
    constructor() {
        this.currentScore = 0;
        this.todayActions = [];
        this.achievements = {
            firstSteps: { unlocked: false, requirement: 5 },
            greenWarrior: { unlocked: false, requirement: 100 },
            ecoHero: { unlocked: false, requirement: 500 }
        };
        this.actionPoints = {
            walk: 10,
            tree: 25,
            water: 15,
            recycle: 20,
            energy: 12,
            reusable: 18
        };

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.checkAchievements();
    }

    setupEventListeners() {
        // Action card click handlers
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = card.dataset.action;
                const points = parseInt(card.dataset.points);
                this.completeAction(action, points);
            });
        });

        // Reset daily score (for demo purposes)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && e.ctrlKey) {
                this.resetDay();
            }
        });
    }

    completeAction(action, points) {
        // Check if action was already completed today
        const today = new Date().toDateString();
        const actionKey = `${action}-${today}`;

        if (this.todayActions.includes(actionKey)) {
            this.showNotification('You already completed this action today!', 'warning');
            return;
        }

        // Add points and record action
        this.currentScore += points;
        this.todayActions.push(actionKey);

        // Save data
        this.saveData();

        // Update display
        this.updateDisplay();
        this.checkAchievements();

        // Show success notification
        this.showNotification(`+${points} points! Great eco-friendly choice!`, 'success');

        // Add to activity history
        this.addActivity(action, points);
    }

    addActivity(action, points) {
        const activityList = document.getElementById('activityList');
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        const actionNames = {
            walk: 'Walk Instead of Drive',
            tree: 'Plant a Tree',
            water: 'Save Water',
            recycle: 'Recycle Properly',
            energy: 'Save Energy',
            reusable: 'Use Reusable Items'
        };

        activityItem.innerHTML = `
            <span class="activity-name">${actionNames[action]}</span>
            <span class="activity-points">+${points} pts</span>
        `;

        activityList.insertBefore(activityItem, activityList.firstChild);

        // Limit history to 10 items
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }

    checkAchievements() {
        const achievements = document.querySelectorAll('.achievement');

        // First Steps (5 actions)
        if (this.todayActions.length >= this.achievements.firstSteps.requirement && !this.achievements.firstSteps.unlocked) {
            this.unlockAchievement('firstSteps');
        }

        // Green Warrior (100 points)
        if (this.currentScore >= this.achievements.greenWarrior.requirement && !this.achievements.greenWarrior.unlocked) {
            this.unlockAchievement('greenWarrior');
        }

        // EcoHero (500 points)
        if (this.currentScore >= this.achievements.ecoHero.requirement && !this.achievements.ecoHero.unlocked) {
            this.unlockAchievement('ecoHero');
        }
    }

    unlockAchievement(achievementKey) {
        this.achievements[achievementKey].unlocked = true;
        const achievementElement = document.getElementById(achievementKey);

        if (achievementElement) {
            achievementElement.classList.remove('locked');
            this.showNotification(`Achievement Unlocked: ${achievementElement.querySelector('span').textContent}!`, 'achievement');
        }

        this.saveData();
    }

    updateDisplay() {
        // Update score display
        document.getElementById('currentScore').textContent = this.currentScore;

        // Update score level
        const scoreLevel = document.getElementById('scoreLevel');
        if (this.currentScore >= 500) {
            scoreLevel.textContent = 'EcoHero';
            scoreLevel.style.background = '#ff9800';
        } else if (this.currentScore >= 100) {
            scoreLevel.textContent = 'Green Warrior';
            scoreLevel.style.background = '#4caf50';
        } else if (this.currentScore >= 25) {
            scoreLevel.textContent = 'Eco-Friendly';
            scoreLevel.style.background = '#66bb6a';
        } else {
            scoreLevel.textContent = 'Beginner';
            scoreLevel.style.background = '#81c784';
        }

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = Math.min((this.currentScore / 500) * 100, 100);
        progressFill.style.width = `${progressPercentage}%`;

        // Update leaderboard (mock data for demo)
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const mockUsers = [
            { name: 'You', score: this.currentScore },
            { name: 'Alice', score: Math.floor(Math.random() * 200) + 50 },
            { name: 'Bob', score: Math.floor(Math.random() * 150) + 25 },
            { name: 'Carol', score: Math.floor(Math.random() * 100) + 10 }
        ];

        mockUsers.sort((a, b) => b.score - a.score);

        leaderboardList.innerHTML = mockUsers.map((user, index) => `
            <div class="leaderboard-item">
                <span class="rank">${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</span>
                <span class="name">${user.name}</span>
                <span class="score">${user.score} pts</span>
            </div>
        `).join('');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        });

        // Set background color based on type
        const colors = {
            success: '#4caf50',
            warning: '#ff9800',
            achievement: '#ff5722'
        };
        notification.style.backgroundColor = colors[type] || '#4caf50';

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    saveData() {
        const data = {
            currentScore: this.currentScore,
            todayActions: this.todayActions,
            achievements: this.achievements,
            date: new Date().toDateString()
        };
        localStorage.setItem('ecoHeroData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('ecoHeroData');
        if (savedData) {
            const data = JSON.parse(savedData);
            const today = new Date().toDateString();

            // Only load data if it's from today
            if (data.date === today) {
                this.currentScore = data.currentScore;
                this.todayActions = data.todayActions;
                this.achievements = data.achievements;
            } else {
                // Reset for new day
                this.resetDay();
            }
        }
    }

    resetDay() {
        this.currentScore = 0;
        this.todayActions = [];
        this.saveData();
        this.updateDisplay();

        // Clear activity list
        document.getElementById('activityList').innerHTML = '';

        this.showNotification('New day started! Ready to be eco-friendly?', 'success');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new EcoHero();

    // Add some demo data for first-time users
    if (!localStorage.getItem('ecoHeroData')) {
        setTimeout(() => {
            app.showNotification('Welcome to EcoHero! Click on actions to start earning points!', 'success');
        }, 1000);
    }
});
