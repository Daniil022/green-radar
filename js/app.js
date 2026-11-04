// ============================================================
// ИНИЦИАЛИЗАЦИЯ И UI
// ============================================================

spawnInitialTargets(6);

// Часы
setInterval(() => {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleTimeString('ru-RU', { hour12: false });
}, 1000);

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById('tab-radar').style.display = target === 'radar' ? 'flex' : 'none';
    document.getElementById('tab-ewar').style.display = target === 'ewar' ? 'flex' : 'none';
  });
});

// Анимация развёртки
function animate() {
  RadarState.sweepAngle = (RadarState.sweepAngle + 0.012) % (Math.PI * 2);
  renderRadar();
  requestAnimationFrame(animate);
}
animate();

// Живое обновление целей
setInterval(() => {
  if (Math.random() > 0.6 && RadarState.targets.length < 12) {
    RadarState.targets.push(createTarget());
  }
  if (Math.random() > 0.7 && RadarState.targets.length > 2) {
    RadarState.targets.shift();
  }
  RadarState.targets.forEach(t => {
    t.angle += (Math.random() - 0.5) * 0.02;
    t.distanceRatio += (Math.random() - 0.5) * 0.005;
    t.distanceRatio = Math.max(0.1, Math.min(0.95, t.distanceRatio));
  });
  updateUI();
}, 2000);

// UI радара
function updateUI() {
  const tcEl = document.getElementById('target-count');
  const hcEl = document.getElementById('hit-count');
  const bcEl = document.getElementById('bearing-count');
  if (tcEl) tcEl.textContent = RadarState.targets.length;
  if (hcEl) hcEl.textContent = RadarState.hits.length;
  if (bcEl && typeof EWAR !== 'undefined') bcEl.textContent = EWAR.bearings.length;

  const threatList = document.getElementById('threat-list');
  if (threatList) {
    const threats = RadarState.targets.filter(t => t.type === 'threat' || t.type === 'unknown');
    if (threats.length === 0) {
      threatList.innerHTML = '<li class="empty">НЕТ АКТИВНЫХ УГРОЗ</li>';
    } else {
      threatList.innerHTML = threats.map(t => {
        const cls = t.type === 'threat' ? 'crit' : 'warn';
        const label = t.type === 'threat' ? 'УГРОЗА' : 'НЕОПОЗНАН';
        return `<li class="${cls}">${label} // ${t.id} // ${t.speed} км/ч</li>`;
      }).join('');
    }
  }

  const log = document.getElementById('hit-log');
  if (log) {
    if (RadarState.hits.length === 0) {
      log.innerHTML = '<div class="log-entry empty">// ОЖИДАНИЕ ДАННЫХ...</div>';
    } else {
      log.innerHTML = RadarState.hits.slice(0, 8).map(h => {
        const time = new Date(h.hitTime).toLocaleTimeString('ru-RU', { hour12: false });
        return `<div class="log-entry hit">[${time}] ПОПАДАНИЕ: ${h.id} / ${h.speed}км/ч / H${h.altitude}м</div>`;
      }).join('');
    }
  }
}

// Кнопка симуляции попадания
document.getElementById('btn-simulate').addEventListener('click', () => {
  let target;
  if (RadarState.targets.length > 0) {
    const idx = Math.floor(Math.random() * RadarState.targets.length);
    target = RadarState.targets[idx];
  } else {
    target = createTarget({ type: 'threat' });
  }
  addHit(target);
  RadarState.targets = RadarState.targets.filter(t => t.id !== target.id);
  updateUI();
});

// --- РЭБ ---
document.getElementById('btn-scan-start').addEventListener('click', () => {
  startScan();
  const st = document.getElementById('scan-status');
  if (st) st.textContent = 'СТАТУС: СКАНИРОВАНИЕ';
});

document.getElementById('btn-scan-stop').addEventListener('click', () => {
  stopScan();
  const st = document.getElementById('scan-status');
  if (st) st.textContent = 'СТАТУС: ОСТАНОВЛЕН';
});

document.getElementById('btn-export').addEventListener('click', () => {
  const data = {
    exportedAt: new Date().toISOString(),
    signals: EWAR.signals,
    bearings: EWAR.bearings,
    log: EWAR.log,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ewar-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addEwarLog('ЭКСПОРТ ВЫПОЛНЕН');
});

// Периодическое обновление UI РЭБ
setInterval(() => {
  const progEl = document.getElementById('scan-progress');
  if (progEl) progEl.textContent = `ПРОГРЕСС: ${Math.round(EWAR.scanProgress * 100)}%`;

  const scEl = document.getElementById('sig-count');
  const bcEl = document.getElementById('brg-count');
  if (scEl) scEl.textContent = EWAR.signals.length;
  if (bcEl) bcEl.textContent = EWAR.bearings.length;

  const tbody = document.querySelector('#sig-table tbody');
  if (tbody) {
    if (EWAR.signals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">// НЕТ ДАННЫХ — ЗАПУСТИТЕ СКАНИРОВАНИЕ</td></tr>';
    } else {
      tbody.innerHTML = EWAR.signals.map(s => `
        <tr class="${s.threat}">
          <td>${s.id}</td>
          <td>${s.freq} МГц</td>
          <td>${s.bandwidth} МГц</td>
          <td>${s.power} dBm</td>
          <td>${s.bearing}°</td>
          <td>${s.type}</td>
          <td><button class="btn-fix" data-id="${s.id}">ПЕЛЕНГ</button></td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-fix').forEach(btn => {
        btn.addEventListener('click', () => {
          fixBearing(btn.dataset.id);
          updateUI();
        });
      });
    }
  }

  const logEl = document.getElementById('ewar-log');
  if (logEl) {
    if (EWAR.log.length === 0) {
      logEl.innerHTML = '<div class="log-entry empty">// ОЖИДАНИЕ...</div>';
    } else {
      logEl.innerHTML = EWAR.log.slice(0, 15)
        .map(l => `<div class="log-entry">[${l.time}] ${l.text}</div>`).join('');
    }
  }
}, 300);

updateUI();
