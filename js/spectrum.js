// ============================================================
// СПЕКТР-АНАЛИЗАТОР
// ============================================================

const specCanvas = document.getElementById('spectrum-canvas');
const sctx = specCanvas ? specCanvas.getContext('2d') : null;

function drawSpectrum() {
  if (!sctx) return;
  const W = specCanvas.width;
  const H = specCanvas.height;

  sctx.clearRect(0, 0, W, H);
  sctx.fillStyle = '#0a0f0a';
  sctx.fillRect(0, 0, W, H);

  // сетка
  sctx.strokeStyle = '#1f2a14';
  sctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += W / 10) {
    sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, H); sctx.stroke();
  }
  for (let y = 0; y <= H; y += H / 5) {
    sctx.beginPath(); sctx.moveTo(0, y); sctx.lineTo(W, y); sctx.stroke();
  }

  // ось частот
  sctx.fillStyle = '#3a4a2a';
  sctx.font = '9px Courier New';
  sctx.textAlign = 'center';
  for (let i = 0; i <= 10; i++) {
    const freq = EWAR.freqMin + (EWAR.freqMax - EWAR.freqMin) * (i / 10);
    const x = (i / 10) * W;
    sctx.fillText(`${Math.round(freq)}`, x, H - 2);
  }

  // шумовая дорожка
  sctx.beginPath();
  sctx.moveTo(0, H * 0.85);
  for (let x = 0; x <= W; x += 4) {
    const noise = (Math.random() - 0.5) * 4;
    sctx.lineTo(x, H * 0.85 + noise);
  }
  sctx.strokeStyle = 'rgba(93, 101, 50, 0.4)';
  sctx.lineWidth = 1;
  sctx.stroke();

  // пики
  EWAR.signals.forEach(sig => {
    if (sig.freq < EWAR.freqMin || sig.freq > EWAR.freqMax) return;
    const x = ((sig.freq - EWAR.freqMin) / (EWAR.freqMax - EWAR.freqMin)) * W;
    const heightRatio = Math.min(1, (sig.power + 100) / 65);
    const peakH = H * (0.15 + heightRatio * 0.6);
    const y = H * 0.85 - peakH;

    const color = sig.threat === 'high' ? '#c0392b'
                 : sig.threat === 'medium' ? '#d4a017'
                 : '#8fb339';

    sctx.beginPath();
    sctx.moveTo(x, H * 0.85);
    sctx.lineTo(x, y);
    sctx.strokeStyle = color;
    sctx.lineWidth = 2;
    sctx.shadowColor = color;
    sctx.shadowBlur = 6;
    sctx.stroke();
    sctx.shadowBlur = 0;

    sctx.fillStyle = color;
    sctx.font = '8px Courier New';
    sctx.textAlign = 'center';
    sctx.fillText(sig.id.replace('SIG-', ''), x, y - 3);
  });

  // линия сканирования
  if (EWAR.scanning) {
    const sx = EWAR.scanProgress * W;
    sctx.beginPath();
    sctx.moveTo(sx, 0);
    sctx.lineTo(sx, H);
    sctx.strokeStyle = 'rgba(143, 179, 57, 0.7)';
    sctx.lineWidth = 1;
    sctx.stroke();
  }

  // рамка
  sctx.strokeStyle = '#5D6532';
  sctx.lineWidth = 1;
  sctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}

setInterval(drawSpectrum, 120);
