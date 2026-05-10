/* ══════════════════════════════════════════
   عداد الخدمة العسكرية - محمود عزت الخولي
   main.js
   ══════════════════════════════════════════ */

// ── GIF PATHS ──
// Drop your two webp files inside assets/gifs/ with these exact names:
//   assets/gifs/off.webp      → shown during off / leave periods
//   assets/gifs/service.webp  → shown during active service
const GIF_OFF     = 'assets/gifs/off.webp';
const GIF_SERVICE = 'assets/gifs/service.webp';

// ── HARDCODED DATES ──
const ENROLLMENT    = new Date(2025,  3,  2, 0,0,0); // 02 Apr 2025
const FACULTY_START = new Date(2025, 10,  8, 0,0,0); // 08 Nov 2025 — كلية الضباط الاحتياط
const SOLDIER_DATE  = new Date(2026,  0, 11, 0,0,0); // 11 Jan 2026 — تحويل جندي مجند
const DISCHARGE     = new Date(2026, 11,  1, 0,0,0); // 01 Dec 2026 — الإنهاء وشهادة الجيش

// ── HARDCODED OFF PERIODS ──
// Note: JS months are 0-indexed (Jan=0 … Dec=11)
const OFF_PERIODS = [
  { start: new Date(2025,11,23,0,0,0), end: new Date(2026, 0, 2,0,0,0) }, // 23/12/2025 → 02/01/2026
  { start: new Date(2026, 0,27,0,0,0), end: new Date(2026, 1, 3,0,0,0) }, // 27/01/2026 → 03/02/2026
  { start: new Date(2026, 1,14,0,0,0), end: new Date(2026, 1,21,0,0,0) }, // 14/02/2026 → 21/02/2026
  { start: new Date(2026, 1,25,0,0,0), end: new Date(2026, 2, 3,0,0,0) }, // 25/02/2026 → 03/03/2026
  { start: new Date(2026, 2,30,0,0,0), end: new Date(2026, 3, 7,0,0,0) }, // 30/03/2026 → 07/04/2026
  { start: new Date(2026, 4, 4,0,0,0), end: new Date(2026, 4,11,0,0,0) }, // 04/05/2026 → 11/05/2026
];

// ── SEGMENT BUILDER ──
function buildSegments() {
  const totalMs = DISCHARGE - ENROLLMENT;
  const now     = new Date();
  const cutoff  = now < DISCHARGE ? now : DISCHARGE;
  const segs    = [];

  // Yellow: enrollment → faculty start (فترة الانتظار)
  const yellowEnd = FACULTY_START < cutoff ? FACULTY_START : cutoff;
  if (yellowEnd > ENROLLMENT)
    segs.push({ start: ENROLLMENT, end: yellowEnd, type: 'pre-entry' });

  // Red + Green within faculty zone: FACULTY_START → SOLDIER_DATE
  if (cutoff > FACULTY_START) {
    const facEnd = SOLDIER_DATE < cutoff ? SOLDIER_DATE : cutoff;
    const facOff = OFF_PERIODS
      .filter(op => op.end > FACULTY_START && op.start < facEnd)
      .map(op => ({
        start: op.start < FACULTY_START ? FACULTY_START : op.start,
        end:   op.end   > facEnd        ? facEnd        : op.end
      }))
      .sort((a, b) => a.start - b.start);

    let cur = FACULTY_START;
    for (const op of facOff) {
      if (op.start > cur) segs.push({ start: cur, end: op.start, type: 'faculty' });
      segs.push({ start: op.start, end: op.end, type: 'off' });
      cur = op.end;
    }
    if (cur < facEnd) segs.push({ start: cur, end: facEnd, type: 'faculty' });
  }

  // Blue + Green: soldier date → cutoff
  if (cutoff > SOLDIER_DATE) {
    const svcStart = SOLDIER_DATE;
    const svcEnd   = cutoff;
    const rel = OFF_PERIODS
      .filter(op => op.end > svcStart && op.start < svcEnd)
      .map(op => ({
        start: op.start < svcStart ? svcStart : op.start,
        end:   op.end   > svcEnd   ? svcEnd   : op.end
      }))
      .sort((a, b) => a.start - b.start);

    let cur = svcStart;
    for (const op of rel) {
      if (op.start > cur) segs.push({ start: cur, end: op.start, type: 'service' });
      segs.push({ start: op.start, end: op.end, type: 'off' });
      cur = op.end;
    }
    if (cur < svcEnd) segs.push({ start: cur, end: svcEnd, type: 'service' });
  }

  // White: remaining days
  if (now < DISCHARGE)
    segs.push({ start: cutoff, end: DISCHARGE, type: 'remaining' });

  return segs.map(s => ({ ...s, width: ((s.end - s.start) / totalMs) * 100 }));
}

// ── STATUS ──
function getCurrentStatus() {
  const now = new Date();
  if (now < ENROLLMENT)   return { text: 'قبل التجنيد',          cls: 'status-waiting' };
  if (now >= DISCHARGE)   return { text: '✅ انتهت الخدمة!',      cls: 'status-done'    };
  if (now < SOLDIER_DATE) return { text: '🏫 في كلية الضباط الاحتياط', cls: 'status-waiting' };
  for (const op of OFF_PERIODS) {
    if (now >= op.start && now <= op.end)
      return { text: '🎉 في أجازة ياعم!', cls: 'status-off' };
  }
  return { text: '🫡 في الخدمة ياعم', cls: 'status-service' };
}

// ── HELPERS ──
function fmtDate(d) {
  return String(d.getDate()).padStart(2,'0') + '/' +
         String(d.getMonth()+1).padStart(2,'0') + '/' +
         d.getFullYear();
}

// ── RENDER ──
function render() {
  const now   = new Date();
  const total = DISCHARGE - ENROLLMENT;
  const done  = Math.max(0, Math.min(now - ENROLLMENT, total));
  const left  = Math.max(0, DISCHARGE - now);
  const pct   = Math.min(100, (done / total) * 100);

  document.getElementById('pct-num').textContent    = pct.toFixed(1) + '%';
  document.getElementById('days-done').textContent  = Math.floor(done  / 86400000).toLocaleString('ar-EG');
  document.getElementById('days-left').textContent  = Math.ceil(left   / 86400000).toLocaleString('ar-EG');
  document.getElementById('days-total').textContent = Math.floor(total / 86400000).toLocaleString('ar-EG');

  // Status
  const st = getCurrentStatus();
  document.getElementById('status-card').className   = 'status-card ' + st.cls;
  document.getElementById('status-text').textContent = st.text;

  // GIF
  const gif = document.getElementById('status-gif');
  if (st.cls === 'status-off') {
    gif.src          = GIF_OFF;
    gif.style.display = 'block';
  } else if (st.cls === 'status-service') {
    gif.src          = GIF_SERVICE;
    gif.style.display = 'block';
  } else {
    gif.style.display = 'none';
    gif.src           = '';
  }

  // Progress bar
  renderBar(now, total);
}

function renderBar(now, total) {
  const bar      = document.getElementById('progress-bar');
  const todayPct = Math.min(100, Math.max(0, (now - ENROLLMENT) / total * 100));
  bar.innerHTML  = '';

  const inner = document.createElement('div');
  inner.className = 'progress-bar-inner';

  const tip      = document.getElementById('bar-tooltip');
  const tipDays  = document.getElementById('tip-days');
  const tipLabel = document.getElementById('tip-label');
  const tipDates = document.getElementById('tip-dates');

  const labels = {
    'pre-entry': 'فترة الانتظار والتقديم والكشوفات والمناظرات والهجص ده كله',
    'faculty':   'كلية الضباط الاحتياط',
    'service':   'جندي مجند',
    'off':       'أجازة',
    'remaining': 'الأيام اللي فاضلة ومحمود عزت يخلص جيش'
  };

  for (const seg of buildSegments()) {
    if (seg.width <= 0) continue;
    const days = Math.round((seg.end - seg.start) / 86400000);
    const d    = document.createElement('div');
    d.className   = 'seg seg-' + seg.type;
    d.style.width = seg.width + '%';

    d.addEventListener('mouseenter', () => {
      tipDays.textContent  = days + ' يوم';
      tipLabel.textContent = labels[seg.type];
      tipDates.textContent = fmtDate(seg.start) + ' → ' + fmtDate(seg.end);
      tip.style.display    = 'block';
    });
    d.addEventListener('mousemove', (e) => {
      tip.style.left = e.clientX + 'px';
      tip.style.top  = e.clientY + 'px';
    });
    d.addEventListener('mouseleave', () => {
      tip.style.display = 'none';
    });

    inner.appendChild(d);
  }

  bar.appendChild(inner);

  // Today marker
  if (now > ENROLLMENT && now < DISCHARGE) {
    const m = document.createElement('div');
    m.className  = 'today-marker';
    m.style.left = todayPct + '%';
    bar.appendChild(m);
  }

  // Finish flag
  const flag       = document.createElement('div');
  flag.className   = 'flag-end';
  flag.textContent = '🏁';
  bar.appendChild(flag);
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  document.getElementById('live-clock').textContent =
    String(now.getHours()).padStart(2,'0')   + ':' +
    String(now.getMinutes()).padStart(2,'0') + ':' +
    String(now.getSeconds()).padStart(2,'0');

  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const months   = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  document.getElementById('live-date').textContent =
    `${dayNames[now.getDay()]}، ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ── INIT ──
updateClock();
render();
setInterval(updateClock, 1000);
setInterval(render, 60000);
