
function format12h(timeStr) {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':');
    h = parseInt(h);
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

function openAddModal(prefill) {
    document.getElementById('editId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Entry';
    document.getElementById('entryTitle').value = '';
    document.getElementById('entryDesc').value = '';
    document.getElementById('entryCat').value = 'Work';
    document.getElementById('entryPriority').value = 'Medium';
    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('entryTime').value = '09:00';
    document.getElementById('entryStatus').value = 'pending';
    const typeMap = {dashboard:'todo','daily-log':'log',todo:'todo',upcoming:'upcoming',calendar:'todo'};
    document.getElementById('entryType').value = prefill || typeMap[currentPage] || 'todo';
    toggleTypeFields();
    document.getElementById('modalOverlay').classList.add('open');
}

function editEntry(id, type) {
    const listMap = {log:'logs',todo:'todos',upcoming:'upcoming'};
    const item = appData[listMap[type]].find(x => x.id == id);
    if (!item) return;
    document.getElementById('editId').value = id;
    document.getElementById('modalTitle').textContent = 'Edit Entry';
    document.getElementById('entryType').value = type;
    document.getElementById('entryTitle').value = item.title || '';
    document.getElementById('entryDesc').value = item.desc || '';
    document.getElementById('entryCat').value = item.category || 'Work';
    document.getElementById('entryPriority').value = item.priority || 'Medium';
    document.getElementById('entryDate').value = item.date || '';
    document.getElementById('entryTime').value = item.time || '';
    document.getElementById('entryStatus').value = item.status || 'pending';
    toggleTypeFields();
    document.getElementById('modalOverlay').classList.add('open');
}

function toggleTypeFields() {
    document.getElementById('statusGroup').style.display = document.getElementById('entryType').value === 'log' ? 'none' : 'flex';
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function maybeCloseModal(e) { if (e.target === document.getElementById('modalOverlay')) closeModal(); }

async function saveEntry() {
    const title = document.getElementById('entryTitle').value.trim();
    if (!title) { toast('Please enter a title!', 'error'); return; }
    const entry = {
        id: document.getElementById('editId').value,
        type: document.getElementById('entryType').value,
        title,
        desc: document.getElementById('entryDesc').value.trim(),
        category: document.getElementById('entryCat').value,
        priority: document.getElementById('entryPriority').value,
        date: document.getElementById('entryDate').value,
        time: document.getElementById('entryTime').value,
        status: document.getElementById('entryStatus').value
    };
    
    const res = await apiCall('save_entry', entry);
    
    // Validating Error Response
    if (res.error === 'unauthorized') {
        toast('You must be logged in to save!', 'error');
        document.getElementById('loginScreen').style.display = 'flex';
        return;
    }
    
    if (res.success) {
        closeModal();
        loadData();
        toast('Entry saved successfully');
    } else {
        toast('Failed to save entry', 'error');
    }
}

function deleteEntry(id, type) {
    _delId = id; _delType = type;
    document.getElementById('confOverlay').classList.add('open');
}

function closeConf() { document.getElementById('confOverlay').classList.remove('open'); }

document.getElementById('confBtn').onclick = async function() {
    closeConf();
    await apiCall('delete_entry', { id: _delId, type: _delType });
    loadData();
    toast('Entry deleted successfully');
};

async function toggleCheck(id) {
    await apiCall('toggle_check', { id });
    loadData();
}

function setTodoTab(tab, el) {
    _todoTab = tab;
    document.querySelectorAll('#todoTabs .inner-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderTodos();
}

function taskHTML(item, type, readonly) {
    const isDone = item.status === 'done';
    const pri = (item.priority||'').toLowerCase();
    const priCls = pri==='high'?'b-ph':pri==='low'?'b-pl':'b-pm';
    const stMap = {pending:'b-sp',progress:'b-sr',done:'b-sd',missed:'b-ph'};
    const stLabel = {pending:'Pending',progress:'In Progress',done:'Done',missed:'Missed'};
    const chkEvt = type==='todo' ? `toggleCheck('${item.id}')` : '';
    const chkSt = type!=='todo' ? 'opacity:0;pointer-events:none;' : '';
    
    const dispTime = format12h(item.time); // Applied 12h format
    
    return `<div class="task-item${isDone?' done':''}"><div class="chk${isDone?' on':''}" onclick="${chkEvt}" style="${chkSt}"></div><div class="task-body"><div class="task-title">${esc(item.title)}</div><div class="task-meta">${item.category ? `<span class="badge b-cat">${esc(item.category)}</span>` : ''}${item.priority ? `<span class="badge ${priCls}">${esc(item.priority)}</span>` : ''}${item.status && type!=='log' ? `<span class="badge ${stMap[item.status]||''}">${stLabel[item.status]||''}</span>` : ''}${item.desc ? `<span style="font-size:13px;color:var(--text3);flex-basis:100%;margin-top:6px;font-weight:600;">${esc(item.desc)}</span>` : ''}</div></div><div class="task-time">${item.date||''} ${dispTime}</div>${!readonly ? `<div class="task-actions"><button class="act-btn edit" onclick="editEntry('${item.id}','${type}')"><i class="fa-solid fa-pen"></i></button><button class="act-btn del" onclick="deleteEntry('${item.id}','${type}')"><i class="fa-solid fa-trash"></i></button></div>` : ''}</div>`;
}
function renderLogs() {
    const search = (document.getElementById('logSearch').value||'').toLowerCase();
    const cat = document.getElementById('logFilterCat').value;
    const dateF = document.getElementById('logFilterDate').value;
    const today = new Date().toISOString().split('T')[0];
    const logs = appData.logs.filter(l => {
        if (search && !l.title.toLowerCase().includes(search) && !(l.desc||'').toLowerCase().includes(search)) return false;
        if (cat && l.category !== cat) return false;
        if (dateF === 'today' && l.date !== today) return false;
        return true;
    });
    const el = document.getElementById('logList');
    el.innerHTML = logs.length ? logs.map(log => `<div class="log-entry"><div class="log-hdr"><span class="log-time">${log.date||'—'} ${log.time||''}</span><span class="badge b-cat">${esc(log.category||'Work')}</span><div class="log-acts"><button class="act-btn edit" onclick="editEntry('${log.id}','log')"><i class="fa-solid fa-pen"></i></button><button class="act-btn del" onclick="deleteEntry('${log.id}','log')"><i class="fa-solid fa-trash"></i></button></div></div><div class="log-title">${esc(log.title)}</div>${log.desc ? `<div class="log-desc">${esc(log.desc)}</div>` : ''}</div>`).join('') : '<div class="empty-state"><i class="fa-solid fa-clipboard empty-icon" style="color: #9c88ff;"></i><p>No log entries yet.</p></div>';
}

function renderTodos() {
    const search = (document.getElementById('todoSearch').value||'').toLowerCase();
    const pri = document.getElementById('todoFilterPriority').value;
    const cat = document.getElementById('todoFilterCat').value;
    const todos = appData.todos.filter(t => {
        if (_todoTab !== 'all' && t.status !== _todoTab) return false;
        if (search && !t.title.toLowerCase().includes(search)) return false;
        if (pri && t.priority !== pri) return false;
        if (cat && t.category !== cat) return false;
        return true;
    });
    document.getElementById('todoList').innerHTML = todos.length ? todos.map(t => taskHTML(t,'todo')).join('') : '<div class="empty-state"><i class="fa-solid fa-check-double empty-icon" style="color: #00d636;"></i><p>No tasks found.</p></div>';
}

function renderUpcoming() {
    const search = (document.getElementById('upSearch').value||'').toLowerCase();
    const cat = document.getElementById('upFilterCat').value;
    const pri = document.getElementById('upFilterPriority').value;
    const items = appData.upcoming.filter(u => {
        if (search && !u.title.toLowerCase().includes(search)) return false;
        if (cat && u.category !== cat) return false;
        if (pri && u.priority !== pri) return false;
        return true;
    }).sort((a,b) => sortKey(a).localeCompare(sortKey(b)));

    if (!items.length) { document.getElementById('upcomingTimeline').innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar-check empty-icon" style="color: #8D03D2;"></i><p>No upcoming tasks.</p></div>'; return; }

    const groups = {};
    items.forEach(i => { const k = i.date||'No Date'; if(!groups[k]) groups[k]=[]; groups[k].push(i); });
    document.getElementById('upcomingTimeline').innerHTML = Object.entries(groups).map(e => {
        return `<div class="tl-grp"><div class="tl-date">${e[0]}</div>${e[1].map((item, i) => `<div class="tl-row"><div class="tl-left"><div class="tl-dot" style="background:#8D03D2; border-color:var(--bg2)"></div>${i < e[1].length-1 ? '<div class="tl-line"></div>' : ''}</div><div class="tl-card"><div style="display:flex;align-items:center;gap:10px;"><div class="tl-card-title">${esc(item.title)}</div><div class="tl-acts"><button class="act-btn edit" onclick="editEntry('${item.id}','upcoming')"><i class="fa-solid fa-pen"></i></button><button class="act-btn del" onclick="deleteEntry('${item.id}','upcoming')"><i class="fa-solid fa-trash"></i></button></div></div><div class="tl-meta"><span class="badge b-cat">${esc(item.category||'Work')}</span></div></div></div>`).join('')}</div>`;
    }).join('');
}

function renderCalendar() {
    const allDates = appData.todos.concat(appData.logs,appData.upcoming).map(x => x.date).filter(Boolean);
    document.getElementById('calMonthTitle').textContent = new Date(calYear,calMonth,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    const firstDay = new Date(calYear,calMonth,1).getDay();
    const days = new Date(calYear,calMonth+1,0).getDate();
    const today = new Date().toISOString().split('T')[0];
    let html = '';
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(n => html += `<div class="cal-dn">${n}</div>`);
    for (let i=0;i<firstDay;i++) html += '<div class="cal-day other-month"></div>';
    for (let day=1;day<=days;day++) {
        const ds = calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
        html += `<div class="cal-day${ds===today?' today':''}${allDates.includes(ds)?' has-task':''}" onclick="calClick('${ds}')">${day}</div>`;
    }
    document.getElementById('calGrid').innerHTML = html;
}

function calClick(date) {
    const all = appData.todos.filter(x=>x.date===date).concat(appData.logs.filter(x=>x.date===date),appData.upcoming.filter(x=>x.date===date));
    document.getElementById('calDayTasks').innerHTML = all.length ? `<div style="font-size:12px;font-weight:800;color:var(--text3);padding:14px 0 8px;">Tasks on ${date}</div>` + all.map(i => taskHTML(i, i.type||'todo', true)).join('') : `<p style="color:var(--text4);font-size:14px;padding:14px 0;">No tasks on ${date}</p>`;
}

function changeMonth(dir) {
    calMonth += dir;
    if (calMonth>11){ calMonth=0; calYear++; }
    if (calMonth<0) { calMonth=11; calYear--; }
    renderCalendar();
}