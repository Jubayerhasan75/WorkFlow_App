function getUpcomingTitle(ds) {
    if (!ds) return "Upcoming Tasks";
    const dt = new Date(ds+'T00:00:00');
    const now = new Date();
    now.setHours(0,0,0,0);
    const diff = Math.ceil((dt - now) / 86400000);
    const mDiff = (dt.getFullYear() - now.getFullYear()) * 12 + dt.getMonth() - now.getMonth();
    const yDiff = dt.getFullYear() - now.getFullYear();
    
    if (diff < 0) return "Overdue Tasks";
    if (diff <= 7) return "Upcoming This Week";
    if (diff <= 14) return "Upcoming Next Week";
    if (mDiff === 0) return "Upcoming This Month";
    if (mDiff === 1) return "Upcoming Next Month";
    if (yDiff === 0) return "Upcoming This Year";
    if (yDiff === 1) return "Upcoming Next Year";
    return "Upcoming in " + dt.getFullYear();
}

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('statToday').textContent = appData.todos.filter(t => t.date === today).length;
    document.getElementById('statDone').textContent = appData.todos.filter(t => t.status === 'done').length;
    document.getElementById('statPending').textContent = appData.todos.filter(t => t.status !== 'done').length;
    document.getElementById('statUpcoming').textContent = appData.upcoming.length;

    const recent = appData.todos.concat(appData.logs).sort((a,b) => (b.id||0)-(a.id||0)).slice(0,5);
    const rEl = document.getElementById('dashRecentList');
    rEl.innerHTML = recent.length
      ? recent.map(i => taskHTML(i, i.type||'todo', true)).join('')
      : '<div class="empty-state"><i class="fa-solid fa-inbox empty-icon" style="color: #0055ff;"></i><p>No activities yet.</p></div>';

    const now = new Date();
    now.setHours(0,0,0,0);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const upItems = appData.upcoming.filter(t => {
        const dt = new Date(t.date+'T00:00:00');
        return dt >= now && dt <= nextWeek;
    }).sort((a,b) => sortKey(a).localeCompare(sortKey(b))).slice(0,4);
    
    const dashUpTitle = document.getElementById('dashUpcomingTitle');
    if (dashUpTitle) {
      dashUpTitle.textContent = upItems.length ? getUpcomingTitle(upItems[0].date) : "Upcoming Tasks";
    }

    const uEl = document.getElementById('dashUpcomingList');
    uEl.innerHTML = upItems.length
      ? upItems.map(i => taskHTML(i,'upcoming',true)).join('')
      : '<div class="empty-state"><i class="fa-solid fa-calendar-days empty-icon" style="color: #8D03D2;"></i><p>No upcoming tasks this week.</p></div>';
}