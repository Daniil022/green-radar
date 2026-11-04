// ============================================================
// ОТРИСОВКА РАДАРА
// ============================================================

const canvas = document.getElementById('radar-canvas');
const ctx = canvas.getContext('2d');
const CX = canvas.width / 2;
const CY = canvas.height / 2;
const RADIUS = Math.min(CX, CY) - 40;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0f0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 1; i <= 4; i++) {
    const r = (RADIUS / 4) * i;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = i === 4 ? '#5D6532' : '#2a3a1a';
    ctx.lineWidth = i === 4 ? 1.5 : 0.8;
    ctx.stroke();
    if (i < 4) {
      ctx.fillStyle = '#3a4a2a';
      ctx.font = '10px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`${(RadarState.maxRange / 4) * i}км`, CX + r + 4, CY - 2);
    }
  }

  ctx.beginPath();
  ctx.moveTo(CX - RADIUS, CY);
  ctx.lineTo(CX + RADIUS, CY);
  ctx.moveTo(CX, CY - RADIUS);
  ctx.lineTo(CX, CY + RADIUS);
  ctx.strokeStyle = '#2a3a1a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg - 90) * Math.PI / 180;
    const x1 = CX + Math.cos(rad) * (RADIUS - 8);
    const y1 = CY + Math.sin(rad) * (RADIUS - 8);
    const x2 = CX + Math.cos(rad) * RADIUS;
    const y2 = CY + Math.sin(rad) * RADIUS;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#5D6532';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (deg % 90 === 0) {
      const lx = CX + Math.cos(rad) * (RADIUS + 18);
      const ly = CY + Math.sin(rad) * (RADIUS + 18);
      ctx.fillStyle = '#5D6532';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`${deg}°`, lx, ly + 4);
    }
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#8fb339';
  ctx.shadowColor = '#8fb339';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSweep(angle) {
  const sweepLength = Math.PI / 3;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.arc(CX, CY, RADIUS, angle - sweepLength, angle);
  ctx.closePath();
  ctx.fillStyle = 'rgba(143, 179, 57, 0.08)';
  ctx.fill();
  ctx.restore();

  const x = CX + Math.cos(angle) * RADIUS;
  const y = CY + Math.sin(angle) * RADIUS;
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = 'rgba(143, 179, 57, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#8fb339';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawTargets() {
  RadarState.targets.forEach(t => {
    const r = t.distanceRatio * RADIUS;
    const x = CX + Math.cos(t.angle) * r;
    const y = CY + Math.sin(t.angle) * r;

    let color = '#8fb339';
    if (t.type === 'threat') color = '#c0392b';
    else if (t.type === 'unknown') color = '#d4a017';

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.font = '9px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(t.id, x + 8, y + 3);
  });
}

function drawHits() {
  RadarState.hits.forEach(h => {
    const r = h.distanceRatio * RADIUS;
    const x = CX + Math.cos(h.angle) * r;
    const y = CY + Math.sin(h.angle) * r;

    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#c0392b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x - 6, y + 6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function drawBearings() {
  if (typeof EWAR === 'undefined') return;
  EWAR.bearings.forEach(brg => {
    const rad = (brg.angleDeg - 90) * Math.PI / 180;
    const spread = 5 * Math.PI / 180;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, RADIUS * 0.9, rad - spread, rad + spread);
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 160, 23, 0.12)';
    ctx.fill();

    const x = CX + Math.cos(rad) * RADIUS * 0.9;
    const y = CY + Math.sin(rad) * RADIUS * 0.9;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // метка у окончания луча
    ctx.fillStyle = '#d4a017';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(brg.signalId.replace('SIG-', 'S'), x, y - 6);
  });
}

function renderRadar() {
  drawGrid();
  drawSweep(RadarState.sweepAngle);
  drawBearings();
  drawTargets();
  drawHits();
}
