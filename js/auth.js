function toggleAuthForm(type) {
    if(type === 'register') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('registerSection').style.display = 'block';
    } else {
        document.getElementById('registerSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
    }
}

function togglePassword(id, icon) {
    const input = document.getElementById(id);
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

async function doLogin() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    const res = await apiCall('login', { username: u, password: p });
    if (res.success) {
        document.getElementById('loginError').style.display = 'none';
        loginSuccess(res.name);
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

async function doRegister() {
    const n = document.getElementById('regName').value.trim();
    const u = document.getElementById('regUser').value.trim();
    const p = document.getElementById('regPass').value;
    if(!n || !u || !p) return;
    const res = await apiCall('register', { name: n, username: u, password: p });
    if (res.success) {
        document.getElementById('regError').style.display = 'none';
        
        document.getElementById('regName').value = '';
        document.getElementById('regUser').value = '';
        document.getElementById('regPass').value = '';
        
        toast('Registration successful! Please sign in.', 'success');
        toggleAuthForm('login');
    } else {
        document.getElementById('regError').style.display = 'block';
    }
}
function loginSuccess(name) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarAvatar').textContent = name.split(' ').map(w=>w[0]).join('').toUpperCase().substr(0,2);
    loadData();
    toast('Welcome, ' + name.split(' ')[0] + '!', 'success');
}

async function doLogout() {
    await apiCall('logout');
    document.getElementById('loginScreen').style.display = 'flex'; 
    toast('Logged out successfully', 'success');
}