const SUPABASE_URL = 'https://mvzpwsvtmxegxsphwfcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0Op1mZxcjbTfwzGylMTBOw_AZILx-MI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'admin@tauros.com';
const ADMIN_PASSWORD = 'tauros2025';

const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function checkPassword() {
  const email = document.getElementById('emailInput').value.trim();
  const pwd   = document.getElementById('passwordInput').value;
  if (email === ADMIN_EMAIL && pwd === ADMIN_PASSWORD) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').classList.add('show');
    loadCitas();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function logout() {
  document.getElementById('dashboard').classList.remove('show');
  document.getElementById('loginBox').style.display = 'block';
  document.getElementById('passwordInput').value = '';
  document.getElementById('emailInput').value = '';
  document.getElementById('loginError').style.display = 'none';
}

function to12h(h) {
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:00 ${suffix}`;
}

function fmtDate(f) {
  const d = new Date(f + 'T12:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function isPast(fecha, horaFin) {
  const end = new Date(fecha + 'T' + String(horaFin).padStart(2,'0') + ':00:00');
  return end < new Date();
}

function renderStats(data) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Totals por barbero y servicio
  const barberCounts = {};
  const serviceCounts = {};
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let pendingCount = 0;
  let finishedCount = 0;

  // Inicio de semana (lunes)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Inicio de mes
  const monthStartStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2,'0') + '-01';

  data.forEach(c => {
    barberCounts[c.barbero] = (barberCounts[c.barbero] || 0) + 1;
    serviceCounts[c.servicio] = (serviceCounts[c.servicio] || 0) + 1;

    if (c.fecha === todayStr) todayCount++;
    if (c.fecha >= weekStartStr) weekCount++;
    if (c.fecha >= monthStartStr) monthCount++;

    if (isPast(c.fecha, c.hora_fin)) {
      finishedCount++;
    } else {
      pendingCount++;
    }
  });

  // Mejor barbero
  let topBarber = '—', topBarberN = 0;
  Object.entries(barberCounts).forEach(([name, n]) => {
    if (n > topBarberN) { topBarber = name; topBarberN = n; }
  });

  // Mejor servicio
  let topService = '—', topServiceN = 0;
  Object.entries(serviceCounts).forEach(([name, n]) => {
    if (n > topServiceN) { topService = name; topServiceN = n; }
  });

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card highlight">
      <div class="stat-num">${data.length}</div>
      <div class="stat-label">Total</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${todayCount}</div>
      <div class="stat-label">Hoy</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${weekCount}</div>
      <div class="stat-label">Esta semana</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${monthCount}</div>
      <div class="stat-label">Este mes</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#4caf50">${pendingCount}</div>
      <div class="stat-label">Pendientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color:#888">${finishedCount}</div>
      <div class="stat-label">Finalizadas</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:1.2rem">${topBarber}</div>
      <div class="stat-label">Mejor barbero (${topBarberN})</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:1.2rem">${topService}</div>
      <div class="stat-label">Mejor servicio (${topServiceN})</div>
    </div>
  `;
}

async function loadCitas() {
  const list = document.getElementById('citasList');
  list.innerHTML = '<div class="loading">Cargando citas...</div>';

  const { data, error } = await sb
    .from('citas')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false });

  if (error) {
    list.innerHTML = `<div class="empty-state"><span class="icon">⚠</span><p>Error: ${error.message}</p></div>`;
    document.getElementById('totalLabel').innerHTML = 'Error';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="icon">📅</span><p>No hay citas registradas</p></div>';
    document.getElementById('totalLabel').innerHTML = '<strong>0</strong> citas';
    document.getElementById('statsGrid').innerHTML = '';
    return;
  }

  document.getElementById('totalLabel').innerHTML = `<strong>${data.length}</strong> cita${data.length !== 1 ? 's' : ''}`;

  renderStats(data);

  let html = '';
  data.forEach((c, i) => {
    const num = data.length - i;
    const past = isPast(c.fecha, c.hora_fin);
    const statusClass = past ? 'badge-past' : '';
    const statusText = past ? 'Finalizado' : 'Pendiente';
    html += `
      <div class="cita-card" style="${past ? 'opacity:0.6' : ''}">
        <div class="cita-left">
          <span class="cita-num">#${num}</span>
          <span class="cita-cliente">${c.nombre || '—'}</span>
          <span class="cita-telefono">${c.telefono || ''}</span>
        </div>
        <div class="cita-meta">
          <span class="badge ${statusClass}">${statusText}</span>
          <span class="badge">${c.servicio || '—'}</span>
          <span class="barbero-label">${c.barbero || '—'}</span>
          <span class="cita-fecha">${fmtDate(c.fecha)}</span>
          <span>${to12h(c.hora_inicio)} – ${to12h(c.hora_fin)}</span>
        </div>
      </div>`;
  });

  list.innerHTML = html;
}
