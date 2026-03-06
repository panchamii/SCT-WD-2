  let running = false;
  let startTime = 0;
  let elapsed = 0;
  let lapStart = 0;
  let laps = [];
  let raf = null;

  const clockCard = document.getElementById('clockCard');
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  const timeMin = document.getElementById('timeMin');
  const timeSec = document.getElementById('timeSec');
  const timeMs = document.getElementById('timeMs');
  const btnStart = document.getElementById('btnStart');
  const btnLap = document.getElementById('btnLap');
  const btnReset = document.getElementById('btnReset');
  const lapsList = document.getElementById('lapsList');
  const lapCount = document.getElementById('lapCount');
  const noLaps = document.getElementById('noLaps');
  const lapSplitRow = document.getElementById('lapSplitRow');
  const lapSplitTime = document.getElementById('lapSplitTime');

  function fmt(ms) {
    const totalSec = Math.floor(ms / 10);
    const mins = Math.floor(totalSec / 6000);
    const secs = Math.floor((totalSec % 6000) / 100);
    const cents = totalSec % 100;
    return {
      min: String(mins).padStart(2, '0'),
      sec: String(secs).padStart(2, '0'),
      ms: String(cents).padStart(2, '0')
    };
  }

  function fmtStr(ms) {
    const f = fmt(ms);
    return `${f.min}:${f.sec}.${f.ms}`;
  }

  function update() {
    const now = running ? elapsed + (performance.now() - startTime) : elapsed;
    const f = fmt(now);
    timeMin.textContent = f.min;
    timeSec.textContent = f.sec;
    timeMs.textContent = '.' + f.ms;

    if (running && laps.length > 0) {
      const lapNow = now - laps.reduce((a, l) => a + l.lap, 0);
      lapSplitTime.textContent = fmtStr(lapNow);
      updateLapSplitColor(lapNow);
    } else if (running) {
      const lapNow = now - lapStart;
      lapSplitTime.textContent = fmtStr(lapNow);
    }

    if (running) raf = requestAnimationFrame(update);
  }

  function updateLapSplitColor(ms) {
    if (laps.length < 2) { lapSplitTime.className = 'lap-split-time'; return; }
    const best = Math.min(...laps.map(l => l.lap));
    const worst = Math.max(...laps.map(l => l.lap));
    lapSplitTime.className = 'lap-split-time' + (ms < best ? ' best' : ms > worst ? ' worst' : '');
  }

  function startStop() {
    if (!running) {
      // Start
      startTime = performance.now();
      if (elapsed === 0) lapStart = 0;
      running = true;
      raf = requestAnimationFrame(update);

      btnStart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>PAUSE`;
      btnStart.className = 'btn btn-pause';
      btnLap.disabled = false;
      btnReset.disabled = true;
      clockCard.classList.add('running');
      statusPill.className = 'status-pill running';
      statusText.textContent = 'RUNNING';
      lapSplitRow.style.display = 'flex';
    } else {
      // Pause
      elapsed += performance.now() - startTime;
      running = false;
      cancelAnimationFrame(raf);

      btnStart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>RESUME`;
      btnStart.className = 'btn btn-start';
      btnLap.disabled = true;
      btnReset.disabled = false;
      clockCard.classList.remove('running');
      statusPill.className = 'status-pill paused';
      statusText.textContent = 'PAUSED';
    }
  }

  function recordLap() {
    if (!running) return;
    const now = elapsed + (performance.now() - startTime);
    const totalLapMs = laps.reduce((a, l) => a + l.lap, 0);
    const lapMs = now - totalLapMs;
    laps.push({ lap: lapMs, total: now });
    renderLaps();
  }

  function renderLaps() {
    noLaps.style.display = laps.length ? 'none' : 'block';
    lapCount.textContent = laps.length + (laps.length === 1 ? ' LAP' : ' LAPS');

    const best = laps.length > 1 ? Math.min(...laps.map(l => l.lap)) : -1;
    const worst = laps.length > 1 ? Math.max(...laps.map(l => l.lap)) : -1;

    lapsList.innerHTML = '';
    if (!laps.length) { lapsList.appendChild(noLaps); return; }

    laps.slice().reverse().forEach((l, ri) => {
      const i = laps.length - ri;
      const isBest = laps.length > 1 && l.lap === best;
      const isWorst = laps.length > 1 && l.lap === worst;
      const cls = isBest ? 'lap-row best' : isWorst ? 'lap-row worst' : 'lap-row';
      const badge = isBest
        ? '<span class="lap-badge best">BEST</span>'
        : isWorst
        ? '<span class="lap-badge worst">SLOW</span>'
        : '—';

      const row = document.createElement('div');
      row.className = cls;
      row.innerHTML = `
        <span class="lap-num">${String(i).padStart(2, '0')}</span>
        <span class="lap-time">${fmtStr(l.lap)}</span>
        <span class="lap-total">${fmtStr(l.total)}</span>
        <span>${badge}</span>
      `;
      lapsList.appendChild(row);
    });
  }

  function reset() {
    if (running) return;
    elapsed = 0;
    lapStart = 0;
    laps = [];

    timeMin.textContent = '00';
    timeSec.textContent = '00';
    timeMs.textContent = '.00';

    btnStart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>START`;
    btnStart.className = 'btn btn-start';
    btnLap.disabled = true;
    btnReset.disabled = true;
    clockCard.classList.remove('running');
    statusPill.className = 'status-pill';
    statusText.textContent = 'READY';
    lapSplitRow.style.display = 'none';
    renderLaps();
    noLaps.style.display = 'block';
    lapsList.appendChild(noLaps);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); startStop(); }
    if (e.key.toLowerCase() === 'l' && running) recordLap();
    if (e.key.toLowerCase() === 'r' && !running && elapsed > 0) reset();
  });
