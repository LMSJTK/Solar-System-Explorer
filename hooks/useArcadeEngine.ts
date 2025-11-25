import { useRef, useCallback } from 'react';
import { Bullet, MinigameAsteroid } from '../types';
import { audioService } from '../services/audioService';

export const useArcadeEngine = () => {
  const bulletsRef = useRef<Bullet[]>([]);
  const asteroidsRef = useRef<MinigameAsteroid[]>([]);
  const idCounter = useRef(0);
  const lastShotTimeRef = useRef(0);

  const spawnAsteroids = useCallback((count: number, width: number, height: number) => {
    for(let i=0; i<count; i++) {
      let x, y;
      do {
        x = Math.random() * width;
        y = Math.random() * height;
      } while (Math.abs(x - width/2) < 150 && Math.abs(y - height/2) < 150);
      createAsteroid(x, y, 3);
    }
  }, []);

  const createAsteroid = useCallback((x: number, y: number, tier: number) => {
    const numPoints = 7 + Math.floor(Math.random() * 5);
    const shape: number[] = [];
    for(let p=0; p<numPoints; p++) shape.push(0.8 + Math.random() * 0.4);
    const size = tier === 3 ? 40 : tier === 2 ? 20 : 10;
    const speed = tier === 3 ? 1 : tier === 2 ? 2 : 3;
    const angle = Math.random() * Math.PI * 2;

    asteroidsRef.current.push({
      id: idCounter.current++,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size, tier, shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }, []);

  const fireBullet = useCallback((shipPosition: {x: number; y: number}, shipRotation: number, shipVelocity: {x: number; y: number}, gameOver: boolean) => {
    if (gameOver) return;
    const now = Date.now();
    if (now - lastShotTimeRef.current < 250) return;

    lastShotTimeRef.current = now;
    audioService.playLaser();

    const tipX = shipPosition.x + Math.cos(shipRotation) * 15;
    const tipY = shipPosition.y + Math.sin(shipRotation) * 15;

    bulletsRef.current.push({
      id: idCounter.current++,
      x: tipX, y: tipY,
      vx: Math.cos(shipRotation) * 10 + shipVelocity.x,
      vy: Math.sin(shipRotation) * 10 + shipVelocity.y,
      life: 60
    });
  }, []);

  const updatePhysics = useCallback((width: number, height: number, shipPosition: {x: number; y: number}, gameOver: boolean): { collision: boolean; scoreGain: number } => {
    let collision = false;
    let scoreGain = 0;

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.life > 0);
    bulletsRef.current.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      if (b.x < 0) b.x = width;
      if (b.x > width) b.x = 0;
      if (b.y < 0) b.y = height;
      if (b.y > height) b.y = 0;
    });

    // Update asteroids
    asteroidsRef.current.forEach(roid => {
      roid.x += roid.vx;
      roid.y += roid.vy;
      roid.rotation += roid.rotationSpeed;
      if (roid.x < -50) roid.x = width + 50;
      if (roid.x > width + 50) roid.x = -50;
      if (roid.y < -50) roid.y = height + 50;
      if (roid.y > height + 50) roid.y = -50;
    });

    // Bullet-Asteroid collisions
    bulletsRef.current.forEach(b => {
      if (b.life <= 0) return;
      for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
        const roid = asteroidsRef.current[i];
        const dx = b.x - roid.x;
        const dy = b.y - roid.y;
        if (Math.sqrt(dx*dx + dy*dy) < roid.size) {
          audioService.playExplosion();
          b.life = 0;
          asteroidsRef.current.splice(i, 1);
          scoreGain += (roid.tier === 3 ? 20 : roid.tier === 2 ? 50 : 100);
          if (roid.tier > 1) {
            createAsteroid(roid.x, roid.y, roid.tier - 1);
            createAsteroid(roid.x, roid.y, roid.tier - 1);
          }
          break;
        }
      }
    });

    // Ship-Asteroid collisions
    if (!gameOver) {
      for (const roid of asteroidsRef.current) {
        const dx = shipPosition.x - roid.x;
        const dy = shipPosition.y - roid.y;
        if (Math.sqrt(dx*dx + dy*dy) < roid.size + 10) {
          collision = true;
          audioService.playExplosion();
          break;
        }
      }
    }

    return { collision, scoreGain };
  }, [createAsteroid]);

  const reset = useCallback(() => {
    bulletsRef.current = [];
    asteroidsRef.current = [];
  }, []);

  return {
    bulletsRef,
    asteroidsRef,
    spawnAsteroids,
    fireBullet,
    updatePhysics,
    reset,
  };
};
