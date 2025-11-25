import { CelestialBody, Star, Asteroid, MinigameAsteroid, ShipState, Vector2D, OrbitSimState, RaidenState } from '../types';

export const renderSolarSystem = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Vector2D,
  stars: Star[],
  bodies: CelestialBody[],
  asteroids: Asteroid[],
  ship: ShipState,
  autopilotActive: boolean,
  autopilotTarget: string | null,
  cameraShake: number = 0
) => {
  // Apply camera shake
  const shakeX = cameraShake > 0.1 ? (Math.random() - 0.5) * cameraShake : 0;
  const shakeY = cameraShake > 0.1 ? (Math.random() - 0.5) * cameraShake : 0;
  ctx.translate(width / 2 - camera.x + shakeX, height / 2 - camera.y + shakeY);

  // Stars
  ctx.fillStyle = '#FFF';
  stars.forEach(star => {
    if (Math.abs(star.x - camera.x) < width && Math.abs(star.y - camera.y) < height) {
      ctx.globalAlpha = star.opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  // Orbit Rings
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  bodies.forEach(body => {
    if (body.orbitRadius > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, body.orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Asteroids
  ctx.fillStyle = '#6b7280';
  asteroids.forEach(roid => {
    if (Math.abs(roid.x - camera.x) < width/1.5 && Math.abs(roid.y - camera.y) < height/1.5) {
      ctx.save();
      ctx.translate(roid.x, roid.y);
      ctx.rotate(roid.rotation);
      ctx.beginPath();
      for(let i=0; i<roid.shape.length; i++) {
        const a = (i / roid.shape.length) * Math.PI * 2;
        const d = roid.size * roid.shape[i];
        if (i===0) ctx.moveTo(Math.cos(a)*d, Math.sin(a)*d);
        else ctx.lineTo(Math.cos(a)*d, Math.sin(a)*d);
      }
      ctx.fill();
      ctx.restore();
    }
  });

  // Celestial Bodies
  bodies.forEach(body => {
    const x = Math.cos(body.angle) * body.orbitRadius;
    const y = Math.sin(body.angle) * body.orbitRadius;
    if (Math.abs(x - camera.x) > width && Math.abs(y - camera.y) > height) return;

    // Sun glow
    if (body.name === 'Sun') {
      const grad = ctx.createRadialGradient(x, y, body.radius * 0.5, x, y, body.radius * 3);
      grad.addColorStop(0, body.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, body.radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(x, y, body.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(body.name, x, y + body.radius + 15);
  });

  // Ship Trail
  if (ship.trail && ship.trail.length > 1) {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ship.trail.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }

  // Ship
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(ship.rotation);

  if (ship.thrusting) {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-25, -5);
    ctx.lineTo(-25, 5);
    ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.5})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fillStyle = '#FFF';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#06B6D4';
  ctx.fill();

  // Autopilot line
  if (autopilotActive && autopilotTarget) {
    const targetBody = bodies.find(b => b.name === autopilotTarget);
    if (targetBody) {
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.translate(width / 2 - camera.x, height / 2 - camera.y);
      const sx = ship.position.x;
      const sy = ship.position.y;
      const tx = Math.cos(targetBody.angle) * targetBody.orbitRadius;
      const ty = Math.sin(targetBody.angle) * targetBody.orbitRadius;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }
  }
};

export const renderArcadeMode = (
  ctx: CanvasRenderingContext2D,
  ship: ShipState,
  bullets: { x: number; y: number }[],
  asteroids: MinigameAsteroid[],
  gameOver: boolean
) => {
  // Bullets
  ctx.fillStyle = '#0ff';
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 2, 4, 4));

  // Asteroids
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  asteroids.forEach(roid => {
    ctx.save();
    ctx.translate(roid.x, roid.y);
    ctx.rotate(roid.rotation);
    ctx.beginPath();
    for(let i=0; i<roid.shape.length; i++) {
      const a = (i / roid.shape.length) * Math.PI * 2;
      const d = roid.size * roid.shape[i];
      if (i===0) ctx.moveTo(Math.cos(a)*d, Math.sin(a)*d);
      else ctx.lineTo(Math.cos(a)*d, Math.sin(a)*d);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  });

  // Ship
  if (!gameOver) {
    ctx.translate(ship.position.x, ship.position.y);
    ctx.rotate(ship.rotation);
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.stroke();
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-18, 0);
      ctx.stroke();
    }
  }
};

export const renderOrbitSimulator = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  zoom: number,
  orbitSim: OrbitSimState,
  orbitParams: { speed: number; distance: number; angle: number }
) => {
  ctx.translate(width/2, height/2);
  ctx.scale(zoom, zoom);

  // Grid
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  const gridSize = 5000;
  for(let i=-gridSize; i<gridSize; i+=100) {
    ctx.moveTo(i, -gridSize);
    ctx.lineTo(i, gridSize);
    ctx.moveTo(-gridSize, i);
    ctx.lineTo(gridSize, i);
  }
  ctx.stroke();

  // Earth
  const grad = ctx.createRadialGradient(0,0,10,0,0,45);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI*2);
  ctx.fill();

  // Trail
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  orbitSim.trail.forEach((p, i) => {
    if (i===0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Satellite
  if (orbitSim.status !== 'crashed') {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(orbitSim.satellite.x, orbitSim.satellite.y, 5 / zoom, 0, Math.PI*2);
    ctx.fill();

    // Visualization Vectors (Only in Ready Mode)
    if (orbitSim.status === 'ready') {
      const rad = (orbitParams.angle * Math.PI) / 180;
      const vx = orbitParams.speed * Math.sin(rad) * 20;
      const vy = orbitParams.speed * Math.cos(rad) * 20;

      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.moveTo(orbitSim.satellite.x, orbitSim.satellite.y);
      ctx.lineTo(orbitSim.satellite.x + vx, orbitSim.satellite.y + vy);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(vy, vx);
      const headLen = 10 / zoom;
      ctx.beginPath();
      ctx.moveTo(orbitSim.satellite.x + vx, orbitSim.satellite.y + vy);
      ctx.lineTo(orbitSim.satellite.x + vx - headLen * Math.cos(angle - Math.PI/6), orbitSim.satellite.y + vy - headLen * Math.sin(angle - Math.PI/6));
      ctx.lineTo(orbitSim.satellite.x + vx - headLen * Math.cos(angle + Math.PI/6), orbitSim.satellite.y + vy - headLen * Math.sin(angle + Math.PI/6));
      ctx.fillStyle = '#ffff00';
      ctx.fill();
    }
  } else {
    // Crash marker
    ctx.fillStyle = 'red';
    ctx.font = `${20 / zoom}px sans-serif`;
    ctx.fillText('IMPACT', orbitSim.satellite.x, orbitSim.satellite.y);
  }
};

export const renderRaidenMode = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RaidenState
) => {
  // Background (Scrolling Mars)
  ctx.fillStyle = '#3f1111';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(200, 50, 50, 0.2)';
  const gridSize = 100;
  const scrollOff = state.scroll % gridSize;
  for(let y = -gridSize + scrollOff; y < height; y += gridSize) {
    for(let x = 0; x < width; x+= gridSize) {
      const seed = Math.sin((y - scrollOff + x) * 999);
      if (seed > 0.5) {
        ctx.beginPath();
        ctx.arc(x + 50, y + 50, 10 + seed * 20, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // Particles
  state.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Powerups
  state.powerups.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI*2);

    if (p.type === 'health') ctx.fillStyle = '#22c55e';
    else if (p.type === 'spread') ctx.fillStyle = '#ef4444';
    else if (p.type === 'speed') ctx.fillStyle = '#3b82f6';
    else if (p.type === 'shield') ctx.fillStyle = '#06b6d4';

    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let char = '?';
    if (p.type === 'health') char = '+';
    else if (p.type === 'spread') char = 'W';
    else if (p.type === 'speed') char = 'S';
    else if (p.type === 'shield') char = 'O';

    ctx.fillText(char, p.x, p.y);
  });

  // Bullets
  state.bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 3, b.y - 8, 6, 16);
  });

  // Enemies
  state.enemies.forEach(e => {
    ctx.fillStyle = e.type === 'heavy' ? '#b91c1c' : e.type === 'interceptor' ? '#c2410c' : '#f97316';
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.fill();
    } else if (e.type === 'interceptor') {
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(-15, 0);
      ctx.lineTo(0, -15);
      ctx.lineTo(15, 0);
      ctx.fill();
    } else {
      ctx.fillRect(-25, -25, 50, 50);
    }
    ctx.fillStyle = 'red';
    ctx.fillRect(-15, -e.height/2 - 10, 30, 4);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(-15, -e.height/2 - 10, 30 * (e.hp / e.maxHp), 4);
    ctx.restore();
  });

  // Player
  if (!state.gameOver) {
    ctx.save();
    ctx.translate(state.player.x, state.player.y);

    if (state.player.shield > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI*2);
      ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + (state.player.shield/200)})`;
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()})`;
    ctx.beginPath();
    ctx.moveTo(-5, 20);
    ctx.lineTo(5, 20);
    ctx.lineTo(0, 40 + (state.player.speedLevel * 5));
    ctx.fill();

    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 10);
    ctx.lineTo(-5, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(5, 15);
    ctx.lineTo(15, 10);
    ctx.closePath();
    ctx.fill();

    if (state.player.weaponLevel > 1) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-18, 5, 3, 10);
      ctx.fillRect(15, 5, 3, 10);
    }

    ctx.restore();
  }
};
