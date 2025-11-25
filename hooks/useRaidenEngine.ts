import { useRef, useCallback } from 'react';
import { RaidenState, RaidenEnemy, RaidenPowerUp, RaidenParticle } from '../types';
import { audioService } from '../services/audioService';

export const useRaidenEngine = () => {
  const stateRef = useRef<RaidenState>({
    player: { x: 0, y: 0, hp: 100, maxHp: 100, cooldown: 0, weaponLevel: 1, speedLevel: 1, shield: 0 },
    enemies: [],
    bullets: [],
    particles: [],
    powerups: [],
    score: 0,
    gameOver: false,
    scroll: 0,
    waveTimer: 0
  });
  const idCounter = useRef(0);

  const spawnEnemy = useCallback((width: number) => {
    const types: ('scout' | 'heavy' | 'interceptor')[] = ['scout', 'scout', 'interceptor', 'heavy'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 50 + Math.random() * (width - 100);

    let hp = 1;
    let w = 30;
    let h = 30;
    let vx = 0;
    let vy = 3;

    if (type === 'heavy') {
      hp = 5; w = 50; h = 50; vy = 1;
    } else if (type === 'interceptor') {
      hp = 2; vy = 2.5; vx = Math.random() > 0.5 ? 2 : -2;
    } else {
      vy = 5;
    }

    stateRef.current.enemies.push({
      id: idCounter.current++,
      x, y: -50,
      type, hp, maxHp: hp,
      width: w, height: h,
      vx, vy,
      cooldown: 0
    });
  }, []);

  const spawnPowerUp = useCallback((x: number, y: number) => {
    const types: RaidenPowerUp['type'][] = ['health', 'spread', 'speed', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    stateRef.current.powerups.push({
      id: idCounter.current++,
      x, y, vy: 2, type
    });
  }, []);

  const spawnParticle = useCallback((x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5;
      stateRef.current.particles.push({
        id: idCounter.current++,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }, []);

  const updatePhysics = useCallback((
    width: number,
    height: number,
    inputX: number,
    inputY: number,
    inputMag: number,
    shouldShoot: boolean
  ): { score: number; hp: number; shield: number; gameOver: boolean } => {
    const state = stateRef.current;

    if (state.gameOver) {
      return { score: state.score, hp: state.player.hp, shield: state.player.shield, gameOver: true };
    }

    // Scroll
    state.scroll += 3;

    // Player Movement
    const speed = 8 + (state.player.speedLevel - 1) * 2;
    state.player.x += inputX * speed;
    state.player.y += inputY * speed;
    state.player.x = Math.max(20, Math.min(width - 20, state.player.x));
    state.player.y = Math.max(20, Math.min(height - 20, state.player.y));

    // Player Shooting
    state.player.cooldown--;
    if (shouldShoot && state.player.cooldown <= 0) {
      const bulletSpeed = 15;

      // Center shot
      state.bullets.push({
        id: idCounter.current++,
        x: state.player.x, y: state.player.y - 20,
        vx: 0, vy: -bulletSpeed,
        isPlayer: true, damage: 1, color: '#0ff'
      });

      // Level 2: Double Stream
      if (state.player.weaponLevel >= 2) {
        state.bullets.push({
          id: idCounter.current++,
          x: state.player.x - 10, y: state.player.y - 15,
          vx: 0, vy: -bulletSpeed,
          isPlayer: true, damage: 1, color: '#0ff'
        });
        state.bullets.push({
          id: idCounter.current++,
          x: state.player.x + 10, y: state.player.y - 15,
          vx: 0, vy: -bulletSpeed,
          isPlayer: true, damage: 1, color: '#0ff'
        });
      }

      // Level 3: Spread Shot
      if (state.player.weaponLevel >= 3) {
        state.bullets.push({
          id: idCounter.current++,
          x: state.player.x, y: state.player.y - 15,
          vx: -5, vy: -bulletSpeed * 0.9,
          isPlayer: true, damage: 1, color: '#0ff'
        });
        state.bullets.push({
          id: idCounter.current++,
          x: state.player.x, y: state.player.y - 15,
          vx: 5, vy: -bulletSpeed * 0.9,
          isPlayer: true, damage: 1, color: '#0ff'
        });
      }

      state.player.cooldown = 8;
      audioService.playLaser();
    }

    // Enemy Spawning
    state.waveTimer++;
    if (state.waveTimer > 60) {
      spawnEnemy(width);
      state.waveTimer = 0;
    }

    // Update Powerups
    state.powerups.forEach(p => p.y += p.vy);

    // Collision: Powerup vs Player
    for (let i = state.powerups.length - 1; i >= 0; i--) {
      const p = state.powerups[i];
      const dist = Math.hypot(state.player.x - p.x, state.player.y - p.y);
      if (dist < 30) {
        if (p.type === 'health') {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
        } else if (p.type === 'spread') {
          state.player.weaponLevel = Math.min(3, state.player.weaponLevel + 1);
        } else if (p.type === 'speed') {
          state.player.speedLevel = Math.min(3, state.player.speedLevel + 1);
        } else if (p.type === 'shield') {
          state.player.shield = Math.min(100, state.player.shield + 50);
        }
        audioService.playAlert();
        state.powerups.splice(i, 1);
      } else if (p.y > height + 50) {
        state.powerups.splice(i, 1);
      }
    }

    // Update Enemies
    state.enemies.forEach(e => {
      e.x += e.vx;
      e.y += e.vy;
      if (e.type === 'interceptor') {
        if (e.x < 50 || e.x > width - 50) e.vx *= -1;
      }
      e.cooldown--;
      if (e.type === 'heavy' && e.cooldown <= 0 && e.y > 0 && e.y < height - 100) {
        const angle = Math.atan2(state.player.y - e.y, state.player.x - e.x);
        state.bullets.push({
          id: idCounter.current++,
          x: e.x, y: e.y + 20,
          vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
          isPlayer: false, damage: 10, color: '#f0f'
        });
        e.cooldown = 120;
      }
    });

    // Update Bullets
    state.bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
    });

    // Collision: Bullet vs Enemy
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      if (!b.isPlayer) continue;

      let hit = false;
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (Math.abs(b.x - e.x) < e.width/2 + 5 && Math.abs(b.y - e.y) < e.height/2 + 5) {
          e.hp -= b.damage;
          hit = true;
          spawnParticle(b.x, b.y, '#fff', 3);
          if (e.hp <= 0) {
            spawnParticle(e.x, e.y, '#f59e0b', 10);
            state.enemies.splice(j, 1);
            state.score += (e.type === 'heavy' ? 50 : e.type === 'interceptor' ? 20 : 10);
            audioService.playExplosion();
            if (Math.random() < 0.15) {
              spawnPowerUp(e.x, e.y);
            }
          }
          break;
        }
      }
      if (hit || b.y < -50) state.bullets.splice(i, 1);
    }

    const takeDamage = (amount: number) => {
      if (state.player.shield > 0) {
        state.player.shield -= amount;
        if (state.player.shield < 0) {
          state.player.hp += state.player.shield;
          state.player.shield = 0;
        }
      } else {
        state.player.hp -= amount;
      }
      spawnParticle(state.player.x, state.player.y, '#f00', 5);
      audioService.playExplosion();
    };

    // Collision: Enemy/Bullet vs Player
    for (const e of state.enemies) {
      if (Math.abs(state.player.x - e.x) < 20 + e.width/2 && Math.abs(state.player.y - e.y) < 20 + e.height/2) {
        takeDamage(20);
        state.enemies = state.enemies.filter(en => en.id !== e.id);
      }
    }
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      if (b.isPlayer) continue;
      if (Math.abs(state.player.x - b.x) < 15 && Math.abs(state.player.y - b.y) < 15) {
        takeDamage(b.damage);
        state.bullets.splice(i, 1);
      }
      if (b.y > height + 50) state.bullets.splice(i, 1);
    }

    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.gameOver = true;
      audioService.playExplosion();
    }

    // Particles
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    state.particles = state.particles.filter(p => p.life > 0);
    state.enemies = state.enemies.filter(e => e.y < height + 100);

    return {
      score: state.score,
      hp: state.player.hp,
      shield: state.player.shield,
      gameOver: state.gameOver
    };
  }, [spawnEnemy, spawnPowerUp, spawnParticle]);

  const reset = useCallback((width: number, height: number) => {
    stateRef.current = {
      player: { x: width/2, y: height - 100, hp: 100, maxHp: 100, cooldown: 0, weaponLevel: 1, speedLevel: 1, shield: 0 },
      enemies: [],
      bullets: [],
      particles: [],
      powerups: [],
      score: 0,
      gameOver: false,
      scroll: 0,
      waveTimer: 0
    };
  }, []);

  return {
    stateRef,
    updatePhysics,
    reset,
  };
};
