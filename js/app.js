let appData = { logs: [], todos: [], upcoming: [] };
let currentPage = 'dashboard';
let _todoTab = 'all';
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let _delId = null;
let _delType = null;

async function apiCall(action, data = {}) {
    try {
        const res = await fetch(`backend/api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.error(e);
        return { error: 'unauthorized' }; // Default to unauthorized if network fails
    }
}

async function loadData() {
    const data = await apiCall('get_data');
    if (data.error === 'unauthorized') {
        document.getElementById('loginScreen').style.display = 'flex'; // Force login screen if not logged in
        return;
    }
    document.getElementById('loginScreen').style.display = 'none';
    appData = data;
    renderAll();
}

function updateDate() {
    const now = new Date();
    const chip = document.getElementById('dateChip');
    if (chip) chip.textContent = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const lbl = document.getElementById('recentDateLabel');
    if (lbl) lbl.textContent = now.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
}

function renderAll() {
    if(typeof renderDashboard === 'function') renderDashboard();
    if(typeof renderLogs === 'function') renderLogs();
    if(typeof renderTodos === 'function') renderTodos();
    if(typeof renderUpcoming === 'function') renderUpcoming();
    updateBadges();
    if (currentPage === 'calendar' && typeof renderCalendar === 'function') renderCalendar();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

function goPage(page, el, pushState = true) {
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
   
    if (el) {
        el.classList.add('active');
    } else {
        document.querySelectorAll('.nav-item').forEach(n => {
            if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(`'${page}'`)) {
                n.classList.add('active');
            }
        });
    }

    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    
    
    const titles = {dashboard:'Dashboard','daily-log':'Daily Work Log',todo:'To-Do List',upcoming:'Upcoming Works',calendar:'Calendar View'};
    document.getElementById('pageTitle').textContent = titles[page] || page;
    currentPage = page;
    
    if (page === 'calendar') renderCalendar();
    closeSidebar();

   
    if (pushState) {
        window.history.pushState({ page: page }, '', '#' + page);
    }
}

function toast(msg, type = 'success') {
    const c = document.getElementById('toastWrap');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<span class="t-icon">${type === 'success' ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>'}</span>${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 280); }, 2800);
}

function updateBadges() {
    document.getElementById('logBadge').textContent = appData.logs.length;
    document.getElementById('todoBadge').textContent = appData.todos.filter(t => t.status !== 'done').length;
    document.getElementById('upcomingBadge').textContent = appData.upcoming.length;
}

function sortKey(item) { return (item.date||'9999')+' '+(item.time||'23:59'); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

setInterval(updateDate, 30000);
updateDate();

// Run on load
window.onload = loadData;

// Dashboard Card Click Navigation
function openFromDashboard(type) {
   
    const navTodo = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('To-Do'));
    const navUpcoming = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Upcoming'));

    if (type === 'today') {
        goPage('todo', navTodo);
        const tab = Array.from(document.querySelectorAll('.inner-tab')).find(el => el.textContent === 'All');
        if(tab) setTodoTab('all', tab);
    } else if (type === 'done') {
        goPage('todo', navTodo);
        const tab = Array.from(document.querySelectorAll('.inner-tab')).find(el => el.textContent === 'Done');
        if(tab) setTodoTab('done', tab);
    } else if (type === 'pending') {
        goPage('todo', navTodo);
        const tab = Array.from(document.querySelectorAll('.inner-tab')).find(el => el.textContent === 'Pending');
        if(tab) setTodoTab('pending', tab);
    } else if (type === 'upcoming') {
        goPage('upcoming', navUpcoming);
    }

}


window.addEventListener('popstate', function(e) {
    
    const prevPage = (e.state && e.state.page) ? e.state.page : 'dashboard';
    

    goPage(prevPage, null, false); 
});


window.addEventListener('DOMContentLoaded', () => {
    window.history.replaceState({ page: 'dashboard' }, '', '#dashboard');
});