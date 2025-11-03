// ExpenseAI - Student Expense Tracker Application
// Modern JavaScript ES6+ Implementation

class ExpenseTracker {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.expenses = [];
        this.categories = [];
        this.smsMessages = [];
        this.charts = {};
        this.theme = 'light';
        
        // Initialize data from JSON
        this.initializeData();
        
        // Bind event listeners
        this.initializeEventListeners();
        
        // Show loading screen initially
        this.showLoadingScreen();
    }

    initializeData() {
        // User profile data
        this.currentUser = {
            name: "Arjun Sharma",
            email: "arjun.sharma@college.edu",
            college: "Indian Institute of Technology Delhi",
            course: "Computer Science & Engineering",
            year: "2nd Year",
            monthlyBudget: 15000,
            profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        };

        // Categories data
        this.categories = [
            {id: 1, name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", budget: 4000},
            {id: 2, name: "Transportation", icon: "🚗", color: "#4ECDC4", budget: 1500},
            {id: 3, name: "Education", icon: "📚", color: "#45B7D1", budget: 3000},
            {id: 4, name: "Entertainment", icon: "🎬", color: "#96CEB4", budget: 2000},
            {id: 5, name: "Shopping", icon: "🛍️", color: "#FECA57", budget: 2500},
            {id: 6, name: "Bills & Utilities", icon: "⚡", color: "#FF9FF3", budget: 1000},
            {id: 7, name: "Healthcare", icon: "🏥", color: "#54A0FF", budget: 500},
            {id: 8, name: "Groceries", icon: "🛒", color: "#5F27CD", budget: 800},
            {id: 9, name: "Personal Care", icon: "💄", color: "#00D2D3", budget: 300},
            {id: 10, name: "Others", icon: "📦", color: "#737373", budget: 400}
        ];

        // Sample transactions
        this.expenses = [
            {id: 1, date: "2025-09-28", amount: 450, description: "Pizza delivery from Dominos", categoryId: 1, type: "expense", paymentMethod: "UPI"},
            {id: 2, date: "2025-09-27", amount: 120, description: "Metro card recharge", categoryId: 2, type: "expense", paymentMethod: "Card"},
            {id: 3, date: "2025-09-26", amount: 2500, description: "Algorithm textbook purchase", categoryId: 3, type: "expense", paymentMethod: "UPI"},
            {id: 4, date: "2025-09-25", amount: 350, description: "Movie tickets INOX", categoryId: 4, type: "expense", paymentMethod: "UPI"},
            {id: 5, date: "2025-09-24", amount: 1200, description: "T-shirt and jeans", categoryId: 5, type: "expense", paymentMethod: "Card"},
            {id: 6, date: "2025-09-23", amount: 15000, description: "Monthly allowance from parents", categoryId: 10, type: "income", paymentMethod: "Bank Transfer"},
            {id: 7, date: "2025-09-22", amount: 85, description: "Coffee at Starbucks", categoryId: 1, type: "expense", paymentMethod: "UPI"},
            {id: 8, date: "2025-09-21", amount: 300, description: "Electricity bill payment", categoryId: 6, type: "expense", paymentMethod: "UPI"},
            {id: 9, date: "2025-09-20", amount: 800, description: "Grocery shopping BigBasket", categoryId: 8, type: "expense", paymentMethod: "Card"},
            {id: 10, date: "2025-09-19", amount: 150, description: "Uber ride to college", categoryId: 2, type: "expense", paymentMethod: "UPI"}
        ];

        // SMS messages for parsing
        this.smsMessages = [
            {id: 1, sender: "HDFCBANK", message: "Dear Customer, Rs 450.00 debited from A/c no. XX1234 on 28-Sep-25 07:23:15 for UPI/DOMINOS PIZZA/UPI. Avl Bal: Rs 12,350.00", parsed: false},
            {id: 2, sender: "SBIBANK", message: "SBI UPI: Rs 120.00 debited from A/c XX5678 to DMRC on 27-Sep-25. UPI Ref no 425891234567. Avl Bal Rs 12,800.00", parsed: false},
            {id: 3, sender: "ICICBANK", message: "ICICI Bank: Rs 2,500.00 debited from Card XX9012 at AMAZON.COM on 26-Sep-25. Avl limit Rs 45,500.00", parsed: false},
            {id: 4, sender: "AXISBANK", message: "Dear Customer, INR 350.00 debited from A/c XX3456 on 25-Sep-25 19:45:22 UPI/INOXMOVIES/UPI. Current Bal INR 11,450.00", parsed: false},
            {id: 5, sender: "KOTAKBNK", message: "Rs 1200.00 debited from Card XX7890 for purchase at LIFESTYLE on 24-Sep-25. Available Credit Limit Rs 38,800.00", parsed: false}
        ];

        // AI suggestions
        this.aiSuggestions = [
            "You've spent 58.5% of your food budget this month. Consider cooking more meals at home to save ₹500-800.",
            "Your transportation costs are 40% below budget. Great job using public transport efficiently!",
            "Education expenses are 83% of budget. Plan ahead for any upcoming textbook purchases.",
            "You have ₹1,250 unused in Entertainment. Consider allocating some to Emergency Fund."
        ];

        // Banking patterns for SMS parsing
        this.bankingPatterns = {
            upiRegex: /UPI.*?Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
            debitRegex: /debited.*?Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
            creditRegex: /credited.*?Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
            merchantPatterns: {
                'DOMINOS': 1, 'PIZZA': 1, 'STARBUCKS': 1, 'CAFE': 1,
                'DMRC': 2, 'UBER': 2, 'OLA': 2, 'METRO': 2,
                'AMAZON': 5, 'FLIPKART': 5, 'MYNTRA': 5, 'LIFESTYLE': 5,
                'INOX': 4, 'PVR': 4, 'BOOKMYSHOW': 4,
                'BIGBASKET': 8, 'GROFERS': 8, 'ZOMATO': 1, 'SWIGGY': 1
            }
        };
    }

    initializeEventListeners() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.hideLoadingScreen();
            this.initializeAuthentication();
        });

        // Authentication forms
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));

        // Navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Sidebar toggle
        document.querySelectorAll('.sidebar-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleSidebar());
        });

        // Add expense form
        document.getElementById('add-expense-form')?.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Theme toggle
        document.querySelector('.theme-toggle')?.addEventListener('click', () => this.toggleTheme());

        // SMS parsing
        document.getElementById('scan-sms')?.addEventListener('click', () => this.scanSMS());
        document.getElementById('process-selected')?.addEventListener('click', () => this.processSelectedSMS());

        // Profile form
        document.getElementById('profile-form')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Live description categorization
        document.getElementById('expense-description')?.addEventListener('input', (e) => this.suggestCategory(e));

        // Search and filters
        document.getElementById('search-transactions')?.addEventListener('input', (e) => this.searchTransactions(e));
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'flex';
        
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    initializeAuthentication() {
        // Check if user is logged in (simulate)
        const isLoggedIn = localStorage.getItem('expenseai_user') || false;
        
        if (isLoggedIn) {
            this.showMainApp();
        } else {
            this.showAuthPages();
        }
    }

    showAuthPages() {
        document.getElementById('auth-container').classList.remove('d-none');
        document.getElementById('app-container').classList.add('d-none');
    }

    showMainApp() {
        document.getElementById('auth-container').classList.add('d-none');
        document.getElementById('app-container').classList.remove('d-none');
        
        // Initialize main app
        this.populateData();
        this.initializeCharts();
        this.showPage('dashboard');
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');
        
        btnText.classList.add('d-none');
        btnSpinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            if (email && password) {
                // Successful login
                localStorage.setItem('expenseai_user', JSON.stringify(this.currentUser));
                if (rememberMe) {
                    localStorage.setItem('expenseai_remember', 'true');
                }
                
                this.showToast('Login successful! Welcome back, ' + this.currentUser.name, 'success');
                this.showMainApp();
            } else {
                // Failed login
                this.showToast('Invalid credentials. Please try again.', 'error');
                
                btnText.classList.remove('d-none');
                btnSpinner.classList.add('d-none');
                submitBtn.disabled = false;
            }
        }, 2000);
    }

    handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('register-email').value;
        const college = document.getElementById('college').value;
        const monthlyBudget = document.getElementById('monthly-budget').value;
        const password = document.getElementById('register-password').value;
        const termsAccepted = document.getElementById('terms').checked;
        
        if (!termsAccepted) {
            this.showToast('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');
        
        btnText.classList.add('d-none');
        btnSpinner.classList.remove('d-none');
        submitBtn.disabled = true;
        
        // Simulate registration
        setTimeout(() => {
            // Update user data
            this.currentUser.name = `${firstName} ${lastName}`;
            this.currentUser.email = email;
            this.currentUser.college = college;
            this.currentUser.monthlyBudget = parseInt(monthlyBudget);
            
            localStorage.setItem('expenseai_user', JSON.stringify(this.currentUser));
            
            this.showToast('Registration successful! Welcome to ExpenseAI!', 'success');
            this.showMainApp();
        }, 2500);
    }

    togglePassword(e) {
        const button = e.currentTarget;
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('register-page').classList.remove('active');
    }

    showRegister() {
        document.getElementById('register-page').classList.add('active');
        document.getElementById('login-page').classList.remove('active');
    }

    handleNavigation(e) {
        const menuItem = e.currentTarget;
        const page = menuItem.dataset.page;
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        menuItem.classList.add('active');
        
        // Show page
        this.showPage(page);
    }

    showPage(pageName) {
        this.currentPage = pageName;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update breadcrumb
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = this.getPageTitle(pageName);
        }
        
        // Initialize page-specific content
        this.initializePage(pageName);
    }

    getPageTitle(pageName) {
        const titles = {
            dashboard: 'Dashboard',
            expenses: 'Expense Management',
            'sms-parser': 'SMS Parser',
            budget: 'Budget Management',
            analytics: 'Analytics & Insights',
            settings: 'Settings'
        };
        return titles[pageName] || 'ExpenseAI';
    }

    initializePage(pageName) {
        switch(pageName) {
            case 'dashboard':
                this.populateDashboard();
                break;
            case 'expenses':
                this.populateExpenses();
                break;
            case 'sms-parser':
                this.populateSMSParser();
                break;
            case 'budget':
                this.populateBudget();
                break;
            case 'analytics':
                this.populateAnalytics();
                break;
            case 'settings':
                this.populateSettings();
                break;
        }
    }

    populateData() {
        // Populate category select options
        const categorySelects = document.querySelectorAll('#expense-category, #category-filter');
        categorySelects.forEach(select => {
            select.innerHTML = '<option value="">Select Category</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.icon} ${category.name}`;
                select.appendChild(option);
            });
        });

        // Set today's date as default
        const dateInput = document.getElementById('expense-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    populateDashboard() {
        // Update stats
        const totalSpent = this.expenses
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);
        
        const budget = this.currentUser.monthlyBudget;
        const remaining = budget - totalSpent;
        const transactionCount = this.expenses.length;
        
        document.getElementById('total-spent').textContent = `₹${totalSpent.toLocaleString()}`;
        document.getElementById('budget-remaining').textContent = `₹${remaining.toLocaleString()}`;
        document.getElementById('transaction-count').textContent = transactionCount;
        document.getElementById('savings-achieved').textContent = `₹${remaining.toLocaleString()}`;
        
        // Update progress bar
        const progressPercentage = (totalSpent / budget) * 100;
        document.querySelector('.progress-bar').style.width = `${progressPercentage}%`;
        
        // Populate recent transactions
        this.populateRecentTransactions();
        
        // Initialize charts if not already done
        if (Object.keys(this.charts).length === 0) {
            this.initializeCharts();
        }
    }

    populateRecentTransactions() {
        const tbody = document.getElementById('recent-transactions');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Get last 5 transactions
        const recentTransactions = this.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        recentTransactions.forEach(expense => {
            const category = this.categories.find(c => c.id === expense.categoryId);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span style="font-size: 1.2rem;">${category?.icon || '📦'}</span>
                        <span>${expense.description}</span>
                    </div>
                </td>
                <td>
                    <span class="category-badge" style="background: ${category?.color}20; color: ${category?.color}">
                        ${category?.name || 'Others'}
                    </span>
                </td>
                <td>${this.formatDate(expense.date)}</td>
                <td>
                    <span class="${expense.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                        ${expense.type === 'income' ? '+' : '-'}₹${expense.amount.toLocaleString()}
                    </span>
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.editTransaction(${expense.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteTransaction(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    populateExpenses() {
        const tbody = document.getElementById('expenses-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(expense => {
                const category = this.categories.find(c => c.id === expense.categoryId);
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="form-check-input" value="${expense.id}">
                    </td>
                    <td>${this.formatDate(expense.date)}</td>
                    <td>${expense.description}</td>
                    <td>
                        <span class="category-badge">
                            ${category?.icon || '📦'} ${category?.name || 'Others'}
                        </span>
                    </td>
                    <td>
                        <span class="${expense.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                            ${expense.type === 'income' ? '+' : '-'}₹${expense.amount.toLocaleString()}
                        </span>
                    </td>
                    <td>${expense.paymentMethod}</td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary" onclick="app.editTransaction(${expense.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteTransaction(${expense.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
    }

    populateSMSParser() {
        const smsList = document.getElementById('sms-list');
        if (!smsList) return;
        
        smsList.innerHTML = '';
        
        this.smsMessages.forEach(sms => {
            const smsItem = document.createElement('div');
            smsItem.className = `sms-item ${sms.parsed ? 'parsed' : ''}`;
            smsItem.dataset.smsId = sms.id;
            
            // Parse amount and merchant for preview
            const amount = this.extractAmountFromSMS(sms.message);
            const merchant = this.extractMerchantFromSMS(sms.message);
            const suggestedCategory = this.suggestCategoryFromSMS(merchant);
            const category = this.categories.find(c => c.id === suggestedCategory);
            
            smsItem.innerHTML = `
                <div class="sms-checkbox">
                    <input type="checkbox" class="form-check-input" ${sms.parsed ? 'disabled' : ''}>
                </div>
                <div class="sms-content">
                    <div class="sms-sender">${sms.sender}</div>
                    <div class="sms-message">${sms.message}</div>
                    <div class="sms-meta">
                        ${amount ? `<span class="sms-amount">₹${amount}</span>` : ''}
                        ${merchant ? `<span>Merchant: ${merchant}</span>` : ''}
                        ${category ? `<span class="sms-category">${category.icon} ${category.name}</span>` : ''}
                        <span class="badge ${sms.parsed ? 'bg-success' : 'bg-warning'}">${sms.parsed ? 'Parsed' : 'Pending'}</span>
                    </div>
                </div>
            `;
            
            smsList.appendChild(smsItem);
        });
        
        // Update stats
        const totalSms = this.smsMessages.length;
        const parsedSms = this.smsMessages.filter(sms => sms.parsed).length;
        const pendingSms = totalSms - parsedSms;
        
        document.getElementById('total-sms').textContent = totalSms;
        document.getElementById('parsed-sms').textContent = parsedSms;
        document.getElementById('pending-sms').textContent = pendingSms;
    }

    populateBudget() {
        const budgetCategories = document.getElementById('budget-categories');
        if (!budgetCategories) return;
        
        budgetCategories.innerHTML = '';
        
        this.categories.forEach(category => {
            const spent = this.expenses
                .filter(e => e.categoryId === category.id && e.type === 'expense')
                .reduce((sum, e) => sum + e.amount, 0);
            
            const percentage = (spent / category.budget) * 100;
            const progressClass = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'safe';
            
            const categoryItem = document.createElement('div');
            categoryItem.className = 'budget-category-item';
            
            categoryItem.innerHTML = `
                <div class="budget-category-header">
                    <div class="budget-category-info">
                        <span class="budget-category-icon">${category.icon}</span>
                        <div>
                            <div class="budget-category-name">${category.name}</div>
                            <div class="budget-amounts">₹${spent.toLocaleString()} / ₹${category.budget.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <strong class="text-${progressClass === 'safe' ? 'success' : progressClass === 'warning' ? 'warning' : 'danger'}">
                            ${percentage.toFixed(1)}%
                        </strong>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="budget-progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            `;
            
            budgetCategories.appendChild(categoryItem);
        });
    }

    populateAnalytics() {
        // Populate AI insights
        const insightsList = document.getElementById('ai-insights-list');
        if (!insightsList) return;
        
        insightsList.innerHTML = '';
        
        this.aiSuggestions.forEach((suggestion, index) => {
            const insightItem = document.createElement('div');
            insightItem.className = 'col-md-6 mb-3';
            
            const icons = ['💡', '🎯', '📊', '💰'];
            const colors = ['primary', 'success', 'warning', 'info'];
            
            insightItem.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-start gap-3">
                            <div class="insight-icon bg-${colors[index % colors.length]} text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem;">
                                ${icons[index % icons.length]}
                            </div>
                            <div>
                                <h6 class="card-title">AI Insight #${index + 1}</h6>
                                <p class="card-text text-muted">${suggestion}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            insightsList.appendChild(insightItem);
        });
        
        // Initialize analytics charts
        this.initializeAnalyticsCharts();
        this.generateSpendingHeatmap();
    }

    populateSettings() {
        // Settings are mostly static HTML, but we can populate user data
        const profileInputs = {
            'first-name': this.currentUser.name.split(' ')[0] || '',
            'last-name': this.currentUser.name.split(' ').slice(1).join(' ') || '',
            'register-email': this.currentUser.email,
            'college': this.currentUser.college,
            'monthly-budget': this.currentUser.monthlyBudget
        };
        
        Object.entries(profileInputs).forEach(([id, value]) => {
            const input = document.querySelector(`#profile-settings input[value="${id}"], #profile-settings input[type="text"], #profile-settings input[type="email"], #profile-settings input[type="number"]`);
            if (input && input.id) {
                input.value = profileInputs[input.id] || input.value;
            }
        });
    }

    initializeCharts() {
        this.initializeDashboardCharts();
    }

    initializeDashboardCharts() {
        // Spending Trends Chart
        const spendingTrendsCtx = document.getElementById('spending-trends-chart');
        if (spendingTrendsCtx) {
            this.charts.spendingTrends = new Chart(spendingTrendsCtx, {
                type: 'line',
                data: {
                    labels: ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025'],
                    datasets: [{
                        label: 'Spending',
                        data: [12450, 13200, 11800, 14100, 12900, 8965],
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#4F46E5',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 6
                    }, {
                        label: 'Budget',
                        data: [15000, 15000, 15000, 15000, 15000, 15000],
                        borderColor: '#10B981',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        // Category Breakdown Chart
        const categoryCtx = document.getElementById('category-chart');
        if (categoryCtx) {
            const categoryData = this.categories.map(category => {
                const spent = this.expenses
                    .filter(e => e.categoryId === category.id && e.type === 'expense')
                    .reduce((sum, e) => sum + e.amount, 0);
                return {
                    label: category.name,
                    value: spent,
                    color: category.color,
                    icon: category.icon
                };
            }).filter(item => item.value > 0);

            this.charts.category = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.map(item => item.label),
                    datasets: [{
                        data: categoryData.map(item => item.value),
                        backgroundColor: categoryData.map(item => item.color),
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverBorderWidth: 4,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, i) => ({
                                        text: `${categoryData[i].icon} ${label}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }

    initializeAnalyticsCharts() {
        // Spending Pattern Chart
        const patternCtx = document.getElementById('spending-pattern-chart');
        if (patternCtx) {
            this.charts.spendingPattern = new Chart(patternCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Average Spending',
                        data: [1200, 800, 1500, 900, 2100, 1800, 1300],
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C'],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Monthly Comparison Chart
        const comparisonCtx = document.getElementById('monthly-comparison-chart');
        if (comparisonCtx) {
            this.charts.monthlyComparison = new Chart(comparisonCtx, {
                type: 'bar',
                data: {
                    labels: ['Jul', 'Aug', 'Sep'],
                    datasets: [{
                        label: 'Current Year',
                        data: [14100, 12900, 8965],
                        backgroundColor: '#4F46E5',
                        borderRadius: 6
                    }, {
                        label: 'Previous Year',
                        data: [13500, 14200, 12800],
                        backgroundColor: '#10B981',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    generateSpendingHeatmap() {
        const heatmapContainer = document.getElementById('spending-heatmap');
        if (!heatmapContainer) return;
        
        heatmapContainer.innerHTML = '';
        
        // Generate 30 days of data
        for (let i = 1; i <= 30; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'heatmap-day';
            
            // Simulate spending levels
            const spending = Math.random() * 2000;
            let level = 'low';
            if (spending > 800) level = 'medium';
            if (spending > 1500) level = 'high';
            
            dayElement.classList.add(level);
            dayElement.textContent = i;
            dayElement.title = `Day ${i}: ₹${spending.toFixed(0)} spent`;
            
            heatmapContainer.appendChild(dayElement);
        }
    }

    handleAddExpense(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const description = document.getElementById('expense-description').value;
        const categoryId = parseInt(document.getElementById('expense-category').value);
        const paymentMethod = document.getElementById('payment-method').value;
        
        if (!amount || !date || !description || !categoryId || !paymentMethod) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }
        
        // Create new expense
        const newExpense = {
            id: this.expenses.length + 1,
            date: date,
            amount: amount,
            description: description,
            categoryId: categoryId,
            type: 'expense',
            paymentMethod: paymentMethod
        };
        
        // Add to expenses array
        this.expenses.unshift(newExpense);
        
        // Show success message
        this.showToast('Expense added successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('add-expense-form').reset();
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        
        // Refresh current page data
        this.populateDashboard();
        if (this.currentPage === 'expenses') {
            this.populateExpenses();
        }
        
        // Update charts
        this.updateCharts();
    }

    suggestCategory(e) {
        const description = e.target.value.toLowerCase();
        const suggestionDiv = document.getElementById('ai-category-suggestion');
        
        if (description.length < 3) {
            suggestionDiv.classList.remove('show');
            return;
        }
        
        // Simple keyword matching for category suggestion
        const keywords = {
            1: ['food', 'pizza', 'burger', 'coffee', 'restaurant', 'cafe', 'dinner', 'lunch', 'dominos', 'starbucks'],
            2: ['uber', 'taxi', 'bus', 'metro', 'transport', 'travel', 'ola', 'auto'],
            3: ['book', 'course', 'education', 'school', 'college', 'study', 'textbook'],
            4: ['movie', 'cinema', 'entertainment', 'game', 'music', 'netflix', 'spotify'],
            5: ['shopping', 'clothes', 'amazon', 'flipkart', 'purchase', 'buy'],
            6: ['electricity', 'bill', 'utility', 'water', 'gas', 'phone'],
            7: ['doctor', 'hospital', 'medicine', 'health', 'medical'],
            8: ['grocery', 'vegetables', 'market', 'bigbasket', 'milk', 'bread'],
            9: ['salon', 'cosmetic', 'personal', 'care', 'shampoo', 'soap']
        };
        
        let suggestedCategoryId = null;
        let maxMatches = 0;
        
        Object.entries(keywords).forEach(([categoryId, words]) => {
            const matches = words.filter(word => description.includes(word)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                suggestedCategoryId = parseInt(categoryId);
            }
        });
        
        if (suggestedCategoryId && maxMatches > 0) {
            const category = this.categories.find(c => c.id === suggestedCategoryId);
            suggestionDiv.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <i class="fas fa-robot text-primary"></i>
                    <span>AI suggests: <strong>${category.icon} ${category.name}</strong></span>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="app.acceptCategorySuggestion(${suggestedCategoryId})">
                        Accept
                    </button>
                </div>
            `;
            suggestionDiv.classList.add('show');
            
            // Show budget impact
            this.showBudgetImpact(suggestedCategoryId, parseFloat(document.getElementById('expense-amount').value) || 0);
        } else {
            suggestionDiv.classList.remove('show');
        }
    }

    acceptCategorySuggestion(categoryId) {
        document.getElementById('expense-category').value = categoryId;
        document.getElementById('ai-category-suggestion').classList.remove('show');
    }

    showBudgetImpact(categoryId, amount) {
        if (!amount || !categoryId) return;
        
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;
        
        const spent = this.expenses
            .filter(e => e.categoryId === categoryId && e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);
        
        const newTotal = spent + amount;
        const percentage = (newTotal / category.budget) * 100;
        
        const budgetImpact = document.getElementById('budget-impact');
        let className = 'show';
        let message = `This expense will bring your ${category.name} spending to ₹${newTotal.toLocaleString()} (${percentage.toFixed(1)}% of budget).`;
        
        if (percentage > 100) {
            className += ' danger';
            message += ' ⚠️ This will exceed your budget!';
        } else if (percentage > 80) {
            className += ' warning';
            message += ' 📊 You\'re approaching your budget limit.';
        }
        
        budgetImpact.className = `budget-impact ${className}`;
        budgetImpact.innerHTML = `<i class="fas fa-info-circle me-2"></i>${message}`;
    }

    // SMS Processing Methods
    scanSMS() {
        const processingStatus = document.getElementById('processing-status');
        const progressBar = document.getElementById('sms-progress');
        const progressText = document.getElementById('progress-text');
        
        processingStatus.classList.remove('d-none');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Scanning messages... ${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                progressText.textContent = 'Scan complete!';
                
                setTimeout(() => {
                    processingStatus.classList.add('d-none');
                    this.showToast('Found 5 transaction messages', 'success');
                    this.populateSMSParser();
                }, 1000);
            }
        }, 300);
    }

    processSelectedSMS() {
        const selectedCheckboxes = document.querySelectorAll('.sms-item input[type="checkbox"]:checked');
        
        if (selectedCheckboxes.length === 0) {
            this.showToast('Please select at least one message to process', 'warning');
            return;
        }
        
        selectedCheckboxes.forEach(checkbox => {
            const smsItem = checkbox.closest('.sms-item');
            const smsId = parseInt(smsItem.dataset.smsId);
            const sms = this.smsMessages.find(s => s.id === smsId);
            
            if (sms && !sms.parsed) {
                // Extract transaction details
                const amount = this.extractAmountFromSMS(sms.message);
                const merchant = this.extractMerchantFromSMS(sms.message);
                const categoryId = this.suggestCategoryFromSMS(merchant);
                const date = this.extractDateFromSMS(sms.message);
                
                // Create expense from SMS
                if (amount && merchant) {
                    const newExpense = {
                        id: this.expenses.length + 1,
                        date: date || new Date().toISOString().split('T')[0],
                        amount: parseFloat(amount.replace(/,/g, '')),
                        description: `${merchant} - Auto-parsed from SMS`,
                        categoryId: categoryId,
                        type: 'expense',
                        paymentMethod: 'UPI'
                    };
                    
                    this.expenses.unshift(newExpense);
                    sms.parsed = true;
                }
            }
        });
        
        this.showToast(`Processed ${selectedCheckboxes.length} SMS messages`, 'success');
        this.populateSMSParser();
        this.populateDashboard();
        this.updateCharts();
    }

    extractAmountFromSMS(message) {
        const patterns = [
            /Rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
            /INR\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
            /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) return match[1];
        }
        
        return null;
    }

    extractMerchantFromSMS(message) {
        const merchants = Object.keys(this.bankingPatterns.merchantPatterns);
        
        for (const merchant of merchants) {
            if (message.toUpperCase().includes(merchant)) {
                return merchant;
            }
        }
        
        // Fallback: extract text between UPI/ and /UPI or after "at"
        const upiMatch = message.match(/UPI\/([^\/]+)\//i);
        if (upiMatch) return upiMatch[1];
        
        const atMatch = message.match(/at\s+([A-Z]+)/i);
        if (atMatch) return atMatch[1];
        
        return 'Unknown Merchant';
    }

    extractDateFromSMS(message) {
        const dateMatch = message.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const monthNames = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            const fullYear = year.length === 2 ? '20' + year : year;
            return `${fullYear}-${monthNames[month]}-${day.padStart(2, '0')}`;
        }
        return new Date().toISOString().split('T')[0];
    }

    suggestCategoryFromSMS(merchant) {
        const merchantUpper = merchant.toUpperCase();
        return this.bankingPatterns.merchantPatterns[merchantUpper] || 10; // Default to "Others"
    }

    selectAllSMS() {
        const checkboxes = document.querySelectorAll('.sms-item input[type="checkbox"]:not([disabled])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.sms-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Utility Methods
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    updateCharts() {
        // Update all charts with new data
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (window.innerWidth <= 1023) {
            sidebar.classList.toggle('show');
            
            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.className = 'sidebar-overlay';
                newOverlay.addEventListener('click', () => this.toggleSidebar());
                document.body.appendChild(newOverlay);
            }
            
            const currentOverlay = document.querySelector('.sidebar-overlay');
            currentOverlay.classList.toggle('show');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.className = `${this.theme}-mode`;
        localStorage.setItem('expenseai_theme', this.theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-toggle i');
        if (this.theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastBody = toast.querySelector('.toast-body');
        
        // Set message and type
        toastBody.textContent = message;
        toast.className = `toast text-bg-${type}`;
        
        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    editTransaction(id) {
        // Implement edit functionality
        this.showToast('Edit functionality coming soon!', 'info');
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.showToast('Transaction deleted successfully!', 'success');
            this.populateDashboard();
            if (this.currentPage === 'expenses') {
                this.populateExpenses();
            }
            this.updateCharts();
        }
    }

    searchTransactions(e) {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#expenses-tbody tr');
        
        rows.forEach(row => {
            const description = row.cells[2]?.textContent.toLowerCase() || '';
            const category = row.cells[3]?.textContent.toLowerCase() || '';
            
            if (description.includes(query) || category.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    applyFilters() {
        this.showToast('Filters applied successfully!', 'success');
        // Implement filtering logic here
    }

    clearFilters() {
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('amount-filter').value = '';
        document.getElementById('search-transactions').value = '';
        
        this.populateExpenses();
        this.showToast('Filters cleared!', 'info');
    }

    exportExpenses() {
        // Create CSV content
        const csvContent = [
            ['Date', 'Description', 'Category', 'Amount', 'Type', 'Payment Method'],
            ...this.expenses.map(expense => {
                const category = this.categories.find(c => c.id === expense.categoryId);
                return [
                    expense.date,
                    expense.description,
                    category?.name || 'Others',
                    expense.amount,
                    expense.type,
                    expense.paymentMethod
                ];
            })
        ].map(row => row.join(',')).join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Expenses exported successfully!', 'success');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('expenseai_user');
            localStorage.removeItem('expenseai_remember');
            location.reload();
        }
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        this.showToast('Profile updated successfully!', 'success');
    }

    requestSMSPermission() {
        this.showToast('SMS permission would be requested in a real app', 'info');
        document.getElementById('sms-permission-status').classList.add('d-none');
    }

    showBudgetModal() {
        this.showToast('Budget creation modal would open here', 'info');
    }
}

// Global functions for onclick handlers
function showLogin() {
    app.showLogin();
}

function showRegister() {
    app.showRegister();
}

function showAddExpense() {
    const modal = new bootstrap.Modal(document.getElementById('addExpenseModal'));
    modal.show();
}

function logout() {
    app.logout();
}

function toggleTheme() {
    app.toggleTheme();
}

function scanSMS() {
    app.scanSMS();
}

function processSelectedSMS() {
    app.processSelectedSMS();
}

function selectAllSMS() {
    app.selectAllSMS();
}

function clearSelection() {
    app.clearSelection();
}

function exportExpenses() {
    app.exportExpenses();
}

function applyFilters() {
    app.applyFilters();
}

function clearFilters() {
    app.clearFilters();
}

function showBudgetModal() {
    app.showBudgetModal();
}

function requestSMSPermission() {
    app.requestSMSPermission();
}

// Initialize the application
const app = new ExpenseTracker();