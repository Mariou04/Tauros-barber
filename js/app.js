// ── CONSTANTES ──
const DAYS_SHORT  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── SUPABASE ──
const SUPABASE_URL = 'https://mvzpwsvtmxegxsphwfcj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0Op1mZxcjbTfwzGylMTBOw_AZILx-MI';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Slots en formato 24h interno, 1 hora por turno
// Lun–Sáb: 9–19 (último turno 7pm, termina 8pm)
// Dom: 9–14 (último turno 2pm, termina 3pm)
const SLOTS_WEEK = [9,10,11,12,13,14,15,16,17,18,19]; // hora inicio
const SLOTS_SUN  = [9,10,11,12,13,14];

function getSlotsForDow(dow) {
  return dow === 0 ? SLOTS_SUN : SLOTS_WEEK;
}

// Convierte hora entera 24h → string 12h "9:00 AM"
function to12h(h) {
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:00 ${suffix}`;
}

let selectedBarber = '';
let selectedCell   = null; // { date: Date, hour: Number }
let weekOffset     = 0;
let highlightDate  = null; // fecha del día resaltado como guía

function getWeekStart(offset) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const dow  = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // retrocede al lunes
  const mon  = new Date(today);
  mon.setDate(today.getDate() + diff + offset * 7);
  return mon;
}

// ── MODAL ──
async function openModal(barber) {
  selectedBarber = barber;
  selectedCell   = null;
  weekOffset     = 0;
  highlightDate  = null;
  document.getElementById('barberName').textContent = barber;
  document.getElementById('bookingForm').style.display = '';
  document.getElementById('bookConfirm').classList.remove('show');
  document.getElementById('clientName').value  = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('service').value     = '';
  updateSummary();
  await renderWeek();
  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function closeOnBackdrop(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

async function prevWeek() {
  if (weekOffset > 0) { weekOffset--; highlightDate = null; await renderWeek(); }
}
async function nextWeek() { weekOffset++; highlightDate = null; await renderWeek(); }

// ── RENDER SEMANAL ──
async function renderWeek() {
  const weekStart = getWeekStart(weekOffset);
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  document.getElementById('weekLabel').textContent =
    `${weekStart.getDate()} ${MONTHS_ES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_ES[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // Consultar citas existentes en la semana
  const { data: existing } = await sb
    .from('citas')
    .select('fecha, hora_inicio')
    .eq('barbero', selectedBarber)
    .gte('fecha', weekStart.toISOString().split('T')[0])
    .lte('fecha', weekEnd.toISOString().split('T')[0]);

  const booked = {};
  if (existing) {
    existing.forEach(b => { booked[b.fecha + '|' + b.hora_inicio] = true; });
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const now   = new Date();

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  // Todos los slots posibles (unión Lun-Dom)
  const allHours = [9,10,11,12,13,14,15,16,17,18,19];

  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';

  // Corner vacío
  const corner = document.createElement('div');
  corner.className = 'wg-corner';
  grid.appendChild(corner);

  // Headers de días
  days.forEach(d => {
    const isPastDay = d < today;
    const isToday   = d.toDateString() === today.toDateString();
    const isSelected = selectedCell && new Date(selectedCell.date).toDateString() === d.toDateString();
    const isHighlighted = highlightDate === d.toDateString();
    const h = document.createElement('div');
    h.className = 'wg-day-header'
      + (isPastDay     ? ' past-day'     : '')
      + (isToday       ? ' today-day'    : '')
      + (isSelected    ? ' active-day'   : '')
      + (isHighlighted ? ' highlight-head' : '');
    h.innerHTML = `<span class="wg-day-name">${DAYS_SHORT[d.getDay()]}</span><span class="wg-day-num">${d.getDate()}</span>`;
    h.addEventListener('click', async function() {
      if (isPastDay) return;
      const ds = d.toDateString();
      highlightDate = highlightDate === ds ? null : ds;
      await renderWeek();
    });
    grid.appendChild(h);
  });

  // Filas de horas
  allHours.forEach(hour => {
    // Label izquierdo
    const lbl = document.createElement('div');
    lbl.className = 'wg-time-label';
    lbl.textContent = to12h(hour);
    grid.appendChild(lbl);

    // Celda por cada día
    days.forEach(d => {
      const dow           = d.getDay();
      const slotsForDay   = getSlotsForDow(dow);
      const isInSchedule  = slotsForDay.includes(hour);
      const isDayPast     = d < today;

      // Verificar si el slot ya pasó hoy
      let isSlotPast = isDayPast;
      if (!isDayPast && d.toDateString() === today.toDateString()) {
        const slotTime = new Date(d);
        slotTime.setHours(hour, 0, 0, 0);
        if (slotTime <= now) isSlotPast = true;
      }

      // Verificar si ya hay una cita agendada
      const dateKey = d.toISOString().split('T')[0] + '|' + hour;
      const isBooked = !!booked[dateKey];

      const cell = document.createElement('div');

      if (!isInSchedule) {
        cell.className = 'wg-cell cell-disabled';
      } else if (isSlotPast) {
        cell.className = 'wg-cell cell-past';
      } else if (isBooked) {
        cell.className = 'wg-cell cell-disabled';
      } else {
        // Disponible ✓
        cell.className = 'wg-cell';

        // ¿Está seleccionado?
        if (selectedCell &&
            new Date(selectedCell.date).toDateString() === d.toDateString() &&
            selectedCell.hour === hour) {
          cell.classList.add('cell-selected');
        }

        // ¿Día resaltado como guía?
        if (highlightDate && d.toDateString() === highlightDate) {
          cell.classList.add('cell-highlight');
        }

        // CLICK
        const capturedDate = new Date(d);
        const capturedHour = hour;
        cell.addEventListener('click', function() {
          selectCell(capturedDate, capturedHour);
        });

        // Etiqueta de hora visible
        const dot = document.createElement('div');
        dot.className = 'cell-dot';
        dot.textContent = to12h(hour);
        cell.appendChild(dot);
      }

      grid.appendChild(cell);
    });
  });
}

async function selectCell(date, hour) {
  selectedCell = { date: new Date(date), hour };
  updateSummary();
  await renderWeek();
}

function updateSummary() {
  const el = document.getElementById('selectionSummary');
  if (!selectedCell) {
    el.innerHTML = 'Selecciona un horario en la agenda →';
  } else {
    const d = selectedCell.date;
    const dateStr = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
    const endHour = selectedCell.hour + 1;
    el.innerHTML = `<strong>${dateStr}</strong> · <strong>${to12h(selectedCell.hour)}</strong> – <strong>${to12h(endHour)}</strong>`;
  }
}

// ── CONFIRMACIÓN ──
async function confirmBooking() {
  const name    = document.getElementById('clientName').value.trim();
  const phone   = document.getElementById('clientPhone').value.trim();
  const service = document.getElementById('service').value;
  if (!name)         { showToast('Por favor ingresa tu nombre.'); return; }
  if (!phone)        { showToast('Por favor ingresa tu teléfono.'); return; }
  if (!service)      { showToast('Por favor selecciona un servicio.'); return; }
  if (!selectedCell) { showToast('Selecciona un día y horario en la agenda.'); return; }

  const d = selectedCell.date;
  const dateStr = `${DAYS_SHORT[d.getDay()]} ${d.getDate()} de ${MONTHS_FULL[d.getMonth()]}`;
  const timeStr = `${to12h(selectedCell.hour)} – ${to12h(selectedCell.hour + 1)}`;

  // Guardar en Supabase
  const { error } = await sb.from('citas').insert({
    nombre: name,
    telefono: phone,
    servicio: service,
    barbero: selectedBarber,
    fecha: d.toISOString().split('T')[0],
    hora_inicio: selectedCell.hour,
    hora_fin: selectedCell.hour + 1
  });

  if (error) {
    showToast('Error al agendar: ' + error.message);
    return;
  }

  // Mostrar confirmación
  document.getElementById('bookingForm').style.display = 'none';
  document.getElementById('bookConfirm').classList.add('show');

  document.getElementById('confirm-name').textContent    = name;
  document.getElementById('confirm-barber').textContent  = selectedBarber;
  document.getElementById('confirm-service').textContent = service;
  document.getElementById('confirm-date').textContent    = dateStr;
  document.getElementById('confirm-time').textContent    = timeStr;
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1a1a1a;border:1px solid #c9a84c;color:#f5f5f5;padding:12px 28px;font-size:0.78rem;letter-spacing:0.1em;z-index:9999;font-family:Montserrat,sans-serif;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._to);
  t._to = setTimeout(() => t.style.opacity = '0', 2800);
}
