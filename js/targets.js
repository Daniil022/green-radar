// ============================================================
// МОДЕЛЬ ЦЕЛЕЙ И ПОПАДАНИЙ
// ============================================================

const RadarState = {
  targets: [],
  hits: [],
  maxRange: 50,
  sweepAngle: 0,
};

function createTarget(overrides = {}) {
  const id = Math.floor(Math.random() * 9000) + 1000;
  const angle = Math.random() * Math.PI * 2;
  const distanceRatio = 0.2 + Math.random() * 0.75;
  const typeRoll = Math.random();
  let type = 'neutral';
  if (typeRoll > 0.85) type = 'threat';
  else if (typeRoll > 0.6) type = 'unknown';

  return {
    id: `TGT-${id}`,
    angle,
    distanceRatio,
    type,
    speed: (Math.random() * 180 + 40).toFixed(0),
    altitude: (Math.random() * 3000 + 100).toFixed(0),
    timestamp: Date.now(),
    ...overrides,
  };
}

function addHit(target) {
  const hit = { ...target, type: 'hit', hitTime: Date.now() };
  RadarState.hits.unshift(hit);
  if (RadarState.hits.length > 20) RadarState.hits.pop();
  return hit;
}

function spawnInitialTargets(n = 6) {
  RadarState.targets = [];
  for (let i = 0; i < n; i++) {
    RadarState.targets.push(createTarget());
  }
}
