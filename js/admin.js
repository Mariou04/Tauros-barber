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
    return;
  }

  document.getElementById('totalLabel').innerHTML = `<strong>${data.length}</strong> cita${data.length !== 1 ? 's' : ''}`;

  let html = '';
  data.forEach((c, i) => {
    const num = data.length - i;
    html += `
      <div class="cita-card">
        <div class="cita-left">
          <span class="cita-num">#${num}</span>
          <span class="cita-cliente">${c.nombre || '—'}</span>
          <span class="cita-telefono">${c.telefono || ''}</span>
        </div>
        <div class="cita-meta">
          <span class="badge">${c.servicio || '—'}</span>
          <span class="barbero-label">${c.barbero || '—'}</span>
          <span class="cita-fecha">${fmtDate(c.fecha)}</span>
          <span>${to12h(c.hora_inicio)} – ${to12h(c.hora_fin)}</span>
        </div>
      </div>`;
  });

  list.innerHTML = html;
}
