
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Joystick } from './Joystick';
import { INITIAL_BODIES, MAX_SPEED, SHIP_ACCELERATION, SHIP_FRICTION, SHIP_ROTATION_SPEED } from '../constants';
import { CelestialBody, ShipState, Vector2D, Star, Asteroid, Bullet, MinigameAsteroid, OrbitSimState, RaidenState, RaidenEnemy, RaidenBullet, RaidenParticle, RaidenPowerUp } from '../types';
import { getPlanetDescription } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { Send, Navigation, Loader2, Info, Rocket, Volume2, VolumeX, Sparkles, Gamepad2, Target, Trophy, RotateCcw, Globe, Play, Settings2, ZoomIn, ZoomOut, Crosshair, Zap, Heart, Shield, ChevronsUp } from 'lucide-react';

export const SolarSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- Game State Refs ---
  const shipRef = useRef<ShipState>({
    position: { x: 800, y: 0 },
    velocity: { x: 0, y: 2 },
    rotation: 0,
    thrusting: false
  });
  
  const joystickVectorRef = useRef<Vector2D>({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const bodiesRef = useRef<CelestialBody[]>(JSON.parse(JSON.stringify(INITIAL_BODIES)));
  const autopilotTargetRef = useRef<string | null>(null);
  const starsRef = useRef<Star[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const cameraRef = useRef<Vector2D>({ x: 0, y: 0 });
  
  // --- Minigame Refs ---
  const arcadeBulletsRef = useRef<Bullet[]>([]);
  const arcadeAsteroidsRef = useRef<MinigameAsteroid[]>([]);
  const arcadeIdCounter = useRef(0);
  const lastShotTimeRef = useRef(0);

  // --- Orbit Sim Refs ---
  const orbitSimRef = useRef<OrbitSimState>({
      satellite: { x: 250, y: 0, vx: 0, vy: 3 },
      trail: [],
      status: 'ready'
  });

  // --- Raiden (Mars) Sim Refs ---
  const raidenRef = useRef<RaidenState>({
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

  // --- React State ---
  const [closestBody, setClosestBody] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Game Modes
  const [gameMode, setGameMode] = useState<'solar' | 'arcade' | 'orbit' | 'raiden'>('solar');
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeGameOver, setArcadeGameOver] = useState(false);

  // Orbit Sim UI State
  const [orbitParams, setOrbitParams] = useState({
      speed: 3.0,
      distance: 250,
      angle: 0
  });
  const [orbitZoom, setOrbitZoom] = useState(0.8);
  
  // Raiden UI State
  const [raidenScore, setRaidenScore] = useState(0);
  const [raidenHp, setRaidenHp] = useState(100);
  const [raidenShield, setRaidenShield] = useState(0);

  // Initialize Stars & Solar System Asteroids
  useEffect(() => {
    // Stars
    const stars: Star[] = [];
    for (let i = 0; i < 1000; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 6000,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random()
      });
    }
    starsRef.current = stars;

    // Solar System Asteroid Belt
    const asteroids: Asteroid[] = [];
    const beltInner = 480;
    const beltOuter = 600;
    for (let i = 0; i < 300; i++) {
        const orbitRadius = beltInner + Math.random() * (beltOuter - beltInner);
        const angle = Math.random() * Math.PI * 2;
        const numPoints = 5 + Math.floor(Math.random() * 5);
        const shape: number[] = [];
        for(let p=0; p<numPoints; p++) shape.push(0.7 + Math.random() * 0.6);

        asteroids.push({
            x: Math.cos(angle) * orbitRadius,
            y: Math.sin(angle) * orbitRadius,
            orbitRadius,
            orbitSpeed: 0.003 + Math.random() * 0.004,
            angle,
            size: 1.5 + Math.random() * 3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            shape
        });
    }
    asteroidsRef.current = asteroids;
  }, []);

  const handleInteraction = () => {
    audioService.init();
  };

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'f', 'enter'].includes(key)) {
            keysRef.current.add(key);
            handleInteraction();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Proximity & AI Logic (Only in Solar Mode)
  useEffect(() => {
    if (gameMode !== 'solar') return;

    if (!closestBody) {
        setAiDescription(null);
        setIsAiLoading(false);
        return;
    }
    audioService.playAlert();
    setAiDescription(null);
    setIsAiLoading(true);

    let isCancelled = false;
    const scanTimer = setTimeout(() => {
        getPlanetDescription(closestBody, false).then(desc => {
            if (!isCancelled) { 
                setAiDescription(desc);
                setIsAiLoading(false);
            }
        });
    }, 1500);

    return () => { 
        isCancelled = true;
        clearTimeout(scanTimer);
    };
  }, [closestBody, gameMode]);

  const handleDeepScan = async () => {
      if (!closestBody) return;
      handleInteraction();
      setIsAiLoading(true);
      const desc = await getPlanetDescription(closestBody, true);
      setAiDescription(desc);
      setIsAiLoading(false);
  };

  // --- Minigame Helpers: Arcade ---
  const startArcadeMinigame = () => {
      setGameMode('arcade');
      setArcadeScore(0);
      setArcadeGameOver(false);
      setAutopilotActive(false);
      
      shipRef.current.position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      shipRef.current.velocity = { x: 0, y: 0 };
      shipRef.current.rotation = -Math.PI / 2;

      arcadeBulletsRef.current = [];
      arcadeAsteroidsRef.current = [];
      spawnArcadeAsteroids(5);
  };

  const spawnArcadeAsteroids = (count: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      for(let i=0; i<count; i++) {
          let x, y;
          do {
            x = Math.random() * width;
            y = Math.random() * height;
          } while (Math.abs(x - width/2) < 150 && Math.abs(y - height/2) < 150);
          createAsteroid(x, y, 3);
      }
  };

  const createAsteroid = (x: number, y: number, tier: number) => {
    const numPoints = 7 + Math.floor(Math.random() * 5);
    const shape: number[] = [];
    for(let p=0; p<numPoints; p++) shape.push(0.8 + Math.random() * 0.4);
    const size = tier === 3 ? 40 : tier === 2 ? 20 : 10;
    const speed = tier === 3 ? 1 : tier === 2 ? 2 : 3;
    const angle = Math.random() * Math.PI * 2;

    arcadeAsteroidsRef.current.push({
        id: arcadeIdCounter.current++,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size, tier, shape,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  };

  const fireBullet = () => {
    if (arcadeGameOver) return;
    const now = Date.now();
    if (now - lastShotTimeRef.current < 250) return;

    lastShotTimeRef.current = now;
    audioService.playLaser();

    const tipX = shipRef.current.position.x + Math.cos(shipRef.current.rotation) * 15;
    const tipY = shipRef.current.position.y + Math.sin(shipRef.current.rotation) * 15;

    arcadeBulletsRef.current.push({
        id: arcadeIdCounter.current++,
        x: tipX, y: tipY,
        vx: Math.cos(shipRef.current.rotation) * 10 + shipRef.current.velocity.x,
        vy: Math.sin(shipRef.current.rotation) * 10 + shipRef.current.velocity.y,
        life: 60
    });
  };

  // --- Minigame Helpers: Orbit Sim ---
  const startOrbitSim = () => {
      setGameMode('orbit');
      setAutopilotActive(false);
      resetOrbitSim();
  };

  const resetOrbitSim = () => {
      orbitSimRef.current = {
          satellite: { x: orbitParams.distance, y: 0, vx: 0, vy: orbitParams.speed },
          trail: [],
          status: 'ready'
      };
  };

  const launchOrbitSim = () => {
      if (orbitSimRef.current.status !== 'ready') return;
      
      const rad = (orbitParams.angle * Math.PI) / 180;
      const vx = orbitParams.speed * Math.sin(rad); 
      const vy = orbitParams.speed * Math.cos(rad);

      orbitSimRef.current.satellite = {
          x: orbitParams.distance,
          y: 0,
          vx: vx,
          vy: vy
      };
      orbitSimRef.current.status = 'running';
      audioService.playLaser(); // Sound effect for launch
  };

  const applyPreset = (type: 'circular' | 'elliptical' | 'escape' | 'crash') => {
      const EARTH_MASS = 1800;
      let d = 250;
      let s = 0;
      let a = 0;

      switch(type) {
          case 'circular':
              d = 250;
              s = Math.sqrt(EARTH_MASS / d); // v = sqrt(GM/r)
              a = 0;
              break;
          case 'elliptical':
              d = 200;
              s = Math.sqrt(EARTH_MASS / d) * 1.15; // Slightly faster than circular
              a = 0;
              break;
          case 'escape':
              d = 200;
              s = Math.sqrt((2 * EARTH_MASS) / d) + 0.5; // v >= sqrt(2GM/r)
              a = 0;
              break;
          case 'crash':
              d = 300;
              s = 1.0;
              a = -45; // Point inwards
              break;
      }

      setOrbitParams({ distance: d, speed: Number(s.toFixed(2)), angle: a });
      orbitSimRef.current.status = 'ready';
      orbitSimRef.current.satellite.x = d;
      orbitSimRef.current.trail = [];
  };

  // --- Minigame Helpers: Raiden (Mars) ---
  const startRaiden = () => {
      setGameMode('raiden');
      setAutopilotActive(false);
      setRaidenScore(0);
      setRaidenHp(100);
      setRaidenShield(0);
      
      const width = window.innerWidth;
      const height = window.innerHeight;

      raidenRef.current = {
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
  };

  const spawnRaidenEnemy = (width: number) => {
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
         // Scout
         vy = 5;
     }

     raidenRef.current.enemies.push({
         id: arcadeIdCounter.current++,
         x, y: -50,
         type, hp, maxHp: hp,
         width: w, height: h,
         vx, vy,
         cooldown: 0
     });
  };

  const spawnRaidenPowerUp = (x: number, y: number) => {
      const types: RaidenPowerUp['type'][] = ['health', 'spread', 'speed', 'shield'];
      const type = types[Math.floor(Math.random() * types.length)];
      raidenRef.current.powerups.push({
          id: arcadeIdCounter.current++,
          x, y, vy: 2, type
      });
  };

  const spawnRaidenParticle = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5;
          raidenRef.current.particles.push({
              id: arcadeIdCounter.current++,
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 30 + Math.random() * 20,
              maxLife: 50,
              color,
              size: 2 + Math.random() * 4
          });
      }
  };

  // --- Main Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = () => {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      const keys = keysRef.current;
      const joystick = joystickVectorRef.current;
      
      // -- Input Handling (Solar & Arcade Only) --
      let inputX = joystick.x;
      let inputY = joystick.y;
      if (keys.has('w') || keys.has('arrowup')) inputY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) inputY += 1;
      if (keys.has('a') || keys.has('arrowleft')) inputX -= 1;
      if (keys.has('d') || keys.has('arrowright')) inputX += 1;

      const inputMag = Math.sqrt(inputX*inputX + inputY*inputY);
      if (inputMag > 1) { inputX /= inputMag; inputY /= inputMag; }

      // Manual Ship Control
      if (gameMode === 'solar' || gameMode === 'arcade') {
          // Thrust logic
          if (inputX !== 0 || inputY !== 0) {
            // Break autopilot if Solar
            if (gameMode === 'solar' && autopilotActive) {
               setAutopilotActive(false);
               autopilotTargetRef.current = null;
            }

            // Shared physics for piloted modes
            const inputAngle = Math.atan2(inputY, inputX);
            let diff = inputAngle - shipRef.current.rotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            shipRef.current.rotation += diff * 0.15;

            const acc = SHIP_ACCELERATION;
            shipRef.current.velocity.x += Math.cos(shipRef.current.rotation) * inputMag * acc;
            shipRef.current.velocity.y += Math.sin(shipRef.current.rotation) * inputMag * acc;
            shipRef.current.thrusting = true;
            
            audioService.setThrust(inputMag);
          } else if (gameMode === 'solar' && autopilotActive && autopilotTargetRef.current) {
               // Solar Autopilot Logic
               const targetBody = bodiesRef.current.find(b => b.name === autopilotTargetRef.current);
               if (targetBody) {
                  const targetX = Math.cos(targetBody.angle) * targetBody.orbitRadius;
                  const targetY = Math.sin(targetBody.angle) * targetBody.orbitRadius;
                  const targetVx = -Math.sin(targetBody.angle) * targetBody.orbitRadius * targetBody.orbitSpeed;
                  const targetVy = Math.cos(targetBody.angle) * targetBody.orbitRadius * targetBody.orbitSpeed;
                  
                  const dx = targetX - shipRef.current.position.x;
                  const dy = targetY - shipRef.current.position.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  const targetAngle = Math.atan2(dy, dx);
                  
                  let diff = targetAngle - shipRef.current.rotation;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  shipRef.current.rotation += diff * 0.1;

                  if (dist > targetBody.radius + 150) {
                      shipRef.current.velocity.x += Math.cos(shipRef.current.rotation) * SHIP_ACCELERATION * 0.8;
                      shipRef.current.velocity.y += Math.sin(shipRef.current.rotation) * SHIP_ACCELERATION * 0.8;
                      shipRef.current.thrusting = true;
                      audioService.setThrust(0.5); 
                  } else {
                      // Station keeping
                      const idealVx = (targetVx + (dx * 0.05));
                      const idealVy = (targetVy + (dy * 0.05));
                      const ax = (idealVx - shipRef.current.velocity.x) * 0.1;
                      const ay = (idealVy - shipRef.current.velocity.y) * 0.1;
                      shipRef.current.velocity.x += ax;
                      shipRef.current.velocity.y += ay;
                      const mag = Math.sqrt(ax*ax + ay*ay);
                      shipRef.current.thrusting = mag > 0.05;
                      audioService.setThrust(Math.min(mag * 5, 0.3));
                  }
               }
          } else {
              shipRef.current.thrusting = false;
              audioService.setThrust(0);
          }
      }

      // Physics Update
      if (gameMode === 'arcade') {
         // Arcade Mode Physics
         if (keys.has(' ')) fireBullet();

         if (!arcadeGameOver) {
             shipRef.current.position.x += shipRef.current.velocity.x;
             shipRef.current.position.y += shipRef.current.velocity.y;
             
             if (shipRef.current.position.x < 0) shipRef.current.position.x = width;
             if (shipRef.current.position.x > width) shipRef.current.position.x = 0;
             if (shipRef.current.position.y < 0) shipRef.current.position.y = height;
             if (shipRef.current.position.y > height) shipRef.current.position.y = 0;
             
             shipRef.current.velocity.x *= 0.99;
             shipRef.current.velocity.y *= 0.99;
         }

         arcadeBulletsRef.current = arcadeBulletsRef.current.filter(b => b.life > 0);
         arcadeBulletsRef.current.forEach(b => {
             b.x += b.vx; b.y += b.vy; b.life--;
             if (b.x < 0) b.x = width; if (b.x > width) b.x = 0;
             if (b.y < 0) b.y = height; if (b.y > height) b.y = 0;
         });

         arcadeAsteroidsRef.current.forEach(roid => {
             roid.x += roid.vx; roid.y += roid.vy; roid.rotation += roid.rotationSpeed;
             if (roid.x < -50) roid.x = width + 50; if (roid.x > width + 50) roid.x = -50;
             if (roid.y < -50) roid.y = height + 50; if (roid.y > height + 50) roid.y = -50;
         });

         // Collisions
         arcadeBulletsRef.current.forEach(b => {
            if (b.life <= 0) return;
            for (let i = arcadeAsteroidsRef.current.length - 1; i >= 0; i--) {
                const roid = arcadeAsteroidsRef.current[i];
                const dx = b.x - roid.x; const dy = b.y - roid.y;
                if (Math.sqrt(dx*dx + dy*dy) < roid.size) {
                    audioService.playExplosion();
                    b.life = 0;
                    arcadeAsteroidsRef.current.splice(i, 1);
                    setArcadeScore(prev => prev + (roid.tier === 3 ? 20 : roid.tier === 2 ? 50 : 100));
                    if (roid.tier > 1) {
                        createAsteroid(roid.x, roid.y, roid.tier - 1);
                        createAsteroid(roid.x, roid.y, roid.tier - 1);
                    }
                    break; 
                }
            }
         });
         if (!arcadeGameOver) {
             for (const roid of arcadeAsteroidsRef.current) {
                 const dx = shipRef.current.position.x - roid.x; const dy = shipRef.current.position.y - roid.y;
                 if (Math.sqrt(dx*dx + dy*dy) < roid.size + 10) {
                     setArcadeGameOver(true);
                     audioService.playExplosion();
                     shipRef.current.thrusting = false;
                     break;
                 }
             }
         }
         if (arcadeAsteroidsRef.current.length === 0 && !arcadeGameOver) {
             spawnArcadeAsteroids(5 + Math.floor(arcadeScore / 1000));
         }

      } else if (gameMode === 'orbit') {
          // Orbit Simulator Physics
          const sim = orbitSimRef.current;
          
          if (sim.status === 'ready') {
              // Lock position to sliders
              sim.satellite.x = orbitParams.distance;
              sim.satellite.y = 0;
              sim.satellite.vx = 0;
              sim.satellite.vy = 0;
          } else if (sim.status === 'running') {
              const earthMass = 1800;
              const rSq = sim.satellite.x**2 + sim.satellite.y**2;
              const r = Math.sqrt(rSq);
              
              if (r < 45) {
                  sim.status = 'crashed';
                  audioService.playExplosion();
              } else if (r > 5000) { 
                  sim.status = 'escaped';
              } else {
                  const force = earthMass / rSq;
                  const ax = -force * (sim.satellite.x / r);
                  const ay = -force * (sim.satellite.y / r);
                  
                  sim.satellite.vx += ax;
                  sim.satellite.vy += ay;
                  sim.satellite.x += sim.satellite.vx;
                  sim.satellite.y += sim.satellite.vy;

                  if (sim.trail.length > 500) sim.trail.shift();
                  if (Math.random() > 0.1) sim.trail.push({x: sim.satellite.x, y: sim.satellite.y});
              }
          }

      } else if (gameMode === 'raiden') {
          // --- RAIDEN (MARS) PHYSICS ---
          const state = raidenRef.current;
          if (!state.gameOver) {
              // Scroll
              state.scroll += 3;
              
              // Player Movement (Input) - Speed increases with speedLevel
              const speed = 8 + (state.player.speedLevel - 1) * 2;
              state.player.x += inputX * speed;
              state.player.y += inputY * speed;
              // Clamp
              state.player.x = Math.max(20, Math.min(width - 20, state.player.x));
              state.player.y = Math.max(20, Math.min(height - 20, state.player.y));

              // Player Shooting (Auto/Space)
              state.player.cooldown--;
              if ((keys.has(' ') || keys.has('f') || keys.has('enter') || inputMag > 0.1) && state.player.cooldown <= 0) {
                  // Weapon Upgrade Logic
                  const bulletSpeed = 15;
                  
                  // Center shot (Always)
                  state.bullets.push({
                      id: arcadeIdCounter.current++,
                      x: state.player.x, y: state.player.y - 20,
                      vx: 0, vy: -bulletSpeed,
                      isPlayer: true, damage: 1, color: '#0ff'
                  });

                  // Level 2: Double Stream (slight offset)
                  if (state.player.weaponLevel >= 2) {
                       state.bullets.push({
                          id: arcadeIdCounter.current++,
                          x: state.player.x - 10, y: state.player.y - 15,
                          vx: 0, vy: -bulletSpeed,
                          isPlayer: true, damage: 1, color: '#0ff'
                      });
                       state.bullets.push({
                          id: arcadeIdCounter.current++,
                          x: state.player.x + 10, y: state.player.y - 15,
                          vx: 0, vy: -bulletSpeed,
                          isPlayer: true, damage: 1, color: '#0ff'
                      });
                  }

                  // Level 3: Spread Shot
                  if (state.player.weaponLevel >= 3) {
                       state.bullets.push({
                          id: arcadeIdCounter.current++,
                          x: state.player.x, y: state.player.y - 15,
                          vx: -5, vy: -bulletSpeed * 0.9,
                          isPlayer: true, damage: 1, color: '#0ff'
                      });
                       state.bullets.push({
                          id: arcadeIdCounter.current++,
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
                  spawnRaidenEnemy(width);
                  state.waveTimer = 0;
              }

              // Update Powerups
              state.powerups.forEach(p => p.y += p.vy);
              
              // Collision: Powerup vs Player
              for (let i = state.powerups.length - 1; i >= 0; i--) {
                  const p = state.powerups[i];
                  const dist = Math.hypot(state.player.x - p.x, state.player.y - p.y);
                  if (dist < 30) {
                      // Apply Effect
                      if (p.type === 'health') {
                          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 25);
                      } else if (p.type === 'spread') {
                          state.player.weaponLevel = Math.min(3, state.player.weaponLevel + 1);
                      } else if (p.type === 'speed') {
                          state.player.speedLevel = Math.min(3, state.player.speedLevel + 1);
                      } else if (p.type === 'shield') {
                          state.player.shield = Math.min(100, state.player.shield + 50);
                      }
                      
                      // Feedback
                      audioService.playAlert(); // Reuse alert sound for pickup
                      setRaidenHp(state.player.hp);
                      setRaidenShield(state.player.shield);
                      state.powerups.splice(i, 1);
                  } else if (p.y > height + 50) {
                      state.powerups.splice(i, 1);
                  }
              }

              // Update Enemies
              state.enemies.forEach(e => {
                  e.x += e.vx; e.y += e.vy;
                  if (e.type === 'interceptor') { if (e.x < 50 || e.x > width - 50) e.vx *= -1; }
                  e.cooldown--;
                  if (e.type === 'heavy' && e.cooldown <= 0 && e.y > 0 && e.y < height - 100) {
                      const angle = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                      state.bullets.push({
                          id: arcadeIdCounter.current++,
                          x: e.x, y: e.y + 20,
                          vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                          isPlayer: false, damage: 10, color: '#f0f'
                      });
                      e.cooldown = 120;
                  }
              });

              // Update Bullets
              state.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });

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
                          spawnRaidenParticle(b.x, b.y, '#fff', 3);
                          if (e.hp <= 0) {
                              spawnRaidenParticle(e.x, e.y, '#f59e0b', 10);
                              state.enemies.splice(j, 1);
                              state.score += (e.type === 'heavy' ? 50 : e.type === 'interceptor' ? 20 : 10);
                              setRaidenScore(state.score);
                              audioService.playExplosion();
                              
                              // Powerup Drop Chance (15%)
                              if (Math.random() < 0.15) {
                                  spawnRaidenPowerUp(e.x, e.y);
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
                          state.player.hp += state.player.shield; // Overflow damage to hull
                          state.player.shield = 0;
                      }
                  } else {
                      state.player.hp -= amount;
                  }
                  setRaidenHp(state.player.hp);
                  setRaidenShield(state.player.shield);
                  spawnRaidenParticle(state.player.x, state.player.y, '#f00', 5);
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
              state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
              state.particles = state.particles.filter(p => p.life > 0);
              state.enemies = state.enemies.filter(e => e.y < height + 100);
          }
      } else {
         // --- Solar Mode Physics ---
         bodiesRef.current.forEach(body => { if (body.orbitSpeed > 0) body.angle += body.orbitSpeed; });
         asteroidsRef.current.forEach(roid => {
            roid.angle += roid.orbitSpeed; roid.rotation += roid.rotationSpeed;
            roid.x = Math.cos(roid.angle) * roid.orbitRadius; roid.y = Math.sin(roid.angle) * roid.orbitRadius;
         });
         
         shipRef.current.velocity.x *= SHIP_FRICTION;
         shipRef.current.velocity.y *= SHIP_FRICTION;
         const speed = Math.sqrt(shipRef.current.velocity.x**2 + shipRef.current.velocity.y**2);
         if (speed > MAX_SPEED * 1.5) {
             const ratio = (MAX_SPEED * 1.5) / speed;
             shipRef.current.velocity.x *= ratio; shipRef.current.velocity.y *= ratio;
         }
         shipRef.current.position.x += shipRef.current.velocity.x;
         shipRef.current.position.y += shipRef.current.velocity.y;

         cameraRef.current.x += (shipRef.current.position.x - cameraRef.current.x) * 0.1;
         cameraRef.current.y += (shipRef.current.position.y - cameraRef.current.y) * 0.1;

         let nearest = null; let minDist = 300;
         bodiesRef.current.forEach(body => {
            const bx = Math.cos(body.angle) * body.orbitRadius; const by = Math.sin(body.angle) * body.orbitRadius;
            const dist = Math.sqrt((bx - shipRef.current.position.x)**2 + (by - shipRef.current.position.y)**2);
            if (dist < minDist + body.radius) { nearest = body.name; minDist = dist; }
         });
         if (nearest !== closestBody) setClosestBody(nearest);
      }

      // 2. Render
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      ctx.save();

      if (gameMode === 'orbit') {
          // Orbit Simulator Render
          ctx.translate(width/2, height/2);
          ctx.scale(orbitZoom, orbitZoom);

          // Grid
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1 / orbitZoom;
          ctx.beginPath();
          const gridSize = 5000;
          for(let i=-gridSize; i<gridSize; i+=100) {
              ctx.moveTo(i, -gridSize); ctx.lineTo(i, gridSize);
              ctx.moveTo(-gridSize, i); ctx.lineTo(gridSize, i);
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
          
          const sim = orbitSimRef.current;

          // Trail
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
          ctx.lineWidth = 2 / orbitZoom;
          ctx.beginPath();
          sim.trail.forEach((p, i) => {
              if (i===0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();

          // Satellite
          if (sim.status !== 'crashed') {
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(sim.satellite.x, sim.satellite.y, 5 / orbitZoom, 0, Math.PI*2);
              ctx.fill();

              // Visualization Vectors (Only in Ready Mode)
              if (sim.status === 'ready') {
                   const rad = (orbitParams.angle * Math.PI) / 180;
                   const vx = orbitParams.speed * Math.sin(rad) * 20; // Scale up for visual
                   const vy = orbitParams.speed * Math.cos(rad) * 20;
                   
                   ctx.strokeStyle = '#ffff00';
                   ctx.lineWidth = 2 / orbitZoom;
                   ctx.beginPath();
                   ctx.moveTo(sim.satellite.x, sim.satellite.y);
                   ctx.lineTo(sim.satellite.x + vx, sim.satellite.y + vy);
                   ctx.stroke();

                   // Arrowhead
                   const angle = Math.atan2(vy, vx);
                   const headLen = 10 / orbitZoom;
                   ctx.beginPath();
                   ctx.moveTo(sim.satellite.x + vx, sim.satellite.y + vy);
                   ctx.lineTo(sim.satellite.x + vx - headLen * Math.cos(angle - Math.PI/6), sim.satellite.y + vy - headLen * Math.sin(angle - Math.PI/6));
                   ctx.lineTo(sim.satellite.x + vx - headLen * Math.cos(angle + Math.PI/6), sim.satellite.y + vy - headLen * Math.sin(angle + Math.PI/6));
                   ctx.fillStyle = '#ffff00';
                   ctx.fill();
              }

          } else {
              // Crash marker
              ctx.fillStyle = 'red';
              ctx.font = `${20 / orbitZoom}px sans-serif`;
              ctx.fillText('IMPACT', sim.satellite.x, sim.satellite.y);
          }

      } else if (gameMode === 'raiden') {
          // --- RAIDEN RENDER ---
          const state = raidenRef.current;
          
          // Background (Scrolling Mars)
          ctx.fillStyle = '#3f1111'; // Dark Mars Red
          ctx.fillRect(0, 0, width, height);
          
          ctx.fillStyle = 'rgba(200, 50, 50, 0.2)';
          const gridSize = 100;
          const scrollOff = state.scroll % gridSize;
          for(let y = -gridSize + scrollOff; y < height; y += gridSize) {
              for(let x = 0; x < width; x+= gridSize) {
                  // Draw craters/rocks randomly based on grid index to fake consistency
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
              // Base
              ctx.beginPath();
              ctx.arc(p.x, p.y, 15, 0, Math.PI*2);
              
              if (p.type === 'health') ctx.fillStyle = '#22c55e'; // Green
              else if (p.type === 'spread') ctx.fillStyle = '#ef4444'; // Red
              else if (p.type === 'speed') ctx.fillStyle = '#3b82f6'; // Blue
              else if (p.type === 'shield') ctx.fillStyle = '#06b6d4'; // Cyan
              
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Icon
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
              // Simple Enemy Shapes
              if (e.type === 'scout') {
                  ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-10, -10); ctx.lineTo(10, -10); ctx.fill();
              } else if (e.type === 'interceptor') {
                  ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(-15, 0); ctx.lineTo(0, -15); ctx.lineTo(15, 0); ctx.fill();
              } else {
                  ctx.fillRect(-25, -25, 50, 50);
              }
              // HP Bar
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
              
              // Shield Visual
              if (state.player.shield > 0) {
                  ctx.beginPath();
                  ctx.arc(0, 0, 30, 0, Math.PI*2);
                  ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + (state.player.shield/200)})`;
                  ctx.fill();
                  ctx.strokeStyle = '#06b6d4';
                  ctx.lineWidth = 1;
                  ctx.stroke();
              }

              // Jet Effect
              ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()})`;
              ctx.beginPath(); ctx.moveTo(-5, 20); ctx.lineTo(5, 20); ctx.lineTo(0, 40 + (state.player.speedLevel * 5)); ctx.fill();

              // Ship Body
              ctx.fillStyle = '#0ea5e9'; // Cyan ship
              ctx.beginPath(); 
              ctx.moveTo(0, -20); ctx.lineTo(-15, 10); ctx.lineTo(-5, 15); 
              ctx.lineTo(0, 10); ctx.lineTo(5, 15); ctx.lineTo(15, 10); 
              ctx.closePath();
              ctx.fill();
              
              // Upgrades Visuals
              if (state.player.weaponLevel > 1) {
                  ctx.fillStyle = '#ef4444';
                  ctx.fillRect(-18, 5, 3, 10); ctx.fillRect(15, 5, 3, 10);
              }
              
              ctx.restore();
          }

      } else if (gameMode === 'arcade') {
         // Arcade Render
         ctx.fillStyle = '#0ff';
         arcadeBulletsRef.current.forEach(b => ctx.fillRect(b.x - 2, b.y - 2, 4, 4));
         ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
         arcadeAsteroidsRef.current.forEach(roid => {
             ctx.save(); ctx.translate(roid.x, roid.y); ctx.rotate(roid.rotation);
             ctx.beginPath();
             for(let i=0; i<roid.shape.length; i++) {
                 const a = (i / roid.shape.length) * Math.PI * 2; const d = roid.size * roid.shape[i];
                 if (i===0) ctx.moveTo(Math.cos(a)*d, Math.sin(a)*d); else ctx.lineTo(Math.cos(a)*d, Math.sin(a)*d);
             }
             ctx.closePath(); ctx.stroke(); ctx.restore();
         });
         if (!arcadeGameOver) {
             ctx.translate(shipRef.current.position.x, shipRef.current.position.y); ctx.rotate(shipRef.current.rotation);
             ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2;
             ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10); ctx.closePath(); ctx.stroke();
             if (shipRef.current.thrusting) { ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-18, 0); ctx.stroke(); }
         }

      } else {
         // Solar Render
         ctx.translate(width / 2 - cameraRef.current.x, height / 2 - cameraRef.current.y);
         ctx.fillStyle = '#FFF';
         starsRef.current.forEach(star => {
            if (Math.abs(star.x - cameraRef.current.x) < width && Math.abs(star.y - cameraRef.current.y) < height) {
                ctx.globalAlpha = star.opacity; ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
            }
         });
         ctx.globalAlpha = 1;
         ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
         bodiesRef.current.forEach(body => { if (body.orbitRadius > 0) { ctx.beginPath(); ctx.arc(0, 0, body.orbitRadius, 0, Math.PI * 2); ctx.stroke(); }});
         ctx.fillStyle = '#6b7280';
         asteroidsRef.current.forEach(roid => {
            if (Math.abs(roid.x - cameraRef.current.x) < width/1.5 && Math.abs(roid.y - cameraRef.current.y) < height/1.5) {
                ctx.save(); ctx.translate(roid.x, roid.y); ctx.rotate(roid.rotation);
                ctx.beginPath(); for(let i=0; i<roid.shape.length; i++) {
                    const a = (i / roid.shape.length) * Math.PI * 2; const d = roid.size * roid.shape[i];
                    if (i===0) ctx.moveTo(Math.cos(a)*d, Math.sin(a)*d); else ctx.lineTo(Math.cos(a)*d, Math.sin(a)*d);
                } ctx.fill(); ctx.restore();
            }
         });
         bodiesRef.current.forEach(body => {
            const x = Math.cos(body.angle) * body.orbitRadius; const y = Math.sin(body.angle) * body.orbitRadius;
            if (Math.abs(x - cameraRef.current.x) > width && Math.abs(y - cameraRef.current.y) > height) return;
            if (body.name === 'Sun') {
                const grad = ctx.createRadialGradient(x, y, body.radius * 0.5, x, y, body.radius * 3);
                grad.addColorStop(0, body.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, body.radius * 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = body.color; ctx.beginPath(); ctx.arc(x, y, body.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFF'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(body.name, x, y + body.radius + 15);
         });
         ctx.translate(shipRef.current.position.x, shipRef.current.position.y); ctx.rotate(shipRef.current.rotation);
         if (shipRef.current.thrusting) {
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-25, -5); ctx.lineTo(-25, 5); ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.5})`; ctx.fill();
         }
         ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -10); ctx.lineTo(-5, 0); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fillStyle = '#FFF'; ctx.fill();
         ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fillStyle = '#06B6D4'; ctx.fill();
         if (autopilotActive && autopilotTargetRef.current) {
             const targetBody = bodiesRef.current.find(b => b.name === autopilotTargetRef.current);
             if (targetBody) {
                 ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.translate(width / 2 - cameraRef.current.x, height / 2 - cameraRef.current.y);
                 const sx = shipRef.current.position.x; const sy = shipRef.current.position.y;
                 const tx = Math.cos(targetBody.angle) * targetBody.orbitRadius; const ty = Math.sin(targetBody.angle) * targetBody.orbitRadius;
                 ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
             }
         }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [autopilotActive, closestBody, gameMode, arcadeGameOver, arcadeScore, orbitParams, orbitZoom, raidenScore, raidenHp, raidenShield]); 

  const engageAutopilot = (target: string) => {
    handleInteraction();
    autopilotTargetRef.current = target;
    setAutopilotActive(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleInteraction();
      const muted = audioService.toggleMute();
      setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" onPointerDown={handleInteraction}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* --- NORMAL MODE HUD --- */}
      {gameMode === 'solar' && (
        <>
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-3 rounded-lg pointer-events-auto max-w-xs flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                        <h1 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
                            <Rocket size={18} /> Solar Explorer
                        </h1>
                        <button onClick={toggleMute} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300" title={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                </div>
                <div className="text-xs text-gray-400">
                    System: {autopilotActive ? 'Orbit Sync Engaged' : 'Manual Control'}
                </div>
                {autopilotActive && autopilotTargetRef.current && (
                    <div className="text-xs text-cyan-300 mt-1 animate-pulse">
                        Targeting: {autopilotTargetRef.current}
                    </div>
                )}
                
                {/* EASTER EGG BUTTONS */}
                {autopilotActive && autopilotTargetRef.current === 'Sun' && (
                    <button 
                        onClick={startArcadeMinigame}
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(147,51,234,0.5)] transition-all"
                    >
                        <Gamepad2 size={16} /> ENTER SIMULATION
                    </button>
                )}
                {autopilotActive && autopilotTargetRef.current === 'Earth' && (
                    <button 
                        onClick={startOrbitSim}
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all"
                    >
                        <Globe size={16} /> ORBIT SIMULATOR
                    </button>
                )}
                {autopilotActive && autopilotTargetRef.current === 'Mars' && (
                    <button 
                        onClick={startRaiden}
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded animate-bounce shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                    >
                        <Crosshair size={16} /> MARS DEFENSE PROTOCOL
                    </button>
                )}
                </div>

                <div className="flex flex-col gap-2 pointer-events-auto max-h-[50vh] overflow-y-auto no-scrollbar">
                    {INITIAL_BODIES.map(b => (
                        <button 
                        key={b.name}
                        onClick={() => engageAutopilot(b.name)}
                        className={`px-3 py-1 text-xs font-mono border rounded transition-colors ${
                            autopilotTargetRef.current === b.name 
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                            : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                        >
                            {b.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Info Panel */}
            {(closestBody || aiDescription) && (
                <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none">
                    <div className="bg-black/80 border border-cyan-500/30 p-4 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.15)] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Info size={16} />
                                <span className="font-bold uppercase tracking-wider text-sm">
                                    {closestBody ? `Proximity Alert: ${closestBody}` : 'Ship Computer'}
                                </span>
                            </div>
                            {closestBody && !isAiLoading && (
                                <button 
                                    onClick={handleDeepScan}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-200 text-xs rounded-full border border-cyan-700/50 transition-colors"
                                >
                                    <Sparkles size={12} />
                                    Deep Scan
                                </button>
                            )}
                        </div>
                        <div className="min-h-[3rem] text-sm text-gray-200 leading-relaxed">
                            {isAiLoading ? (
                                <div className="flex items-center gap-2 text-gray-500 py-1">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Processing Neural Network Request...</span>
                                </div>
                            ) : (
                                aiDescription || "Scanning..."
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
      )}

      {/* --- ARCADE MODE HUD --- */}
      {gameMode === 'arcade' && (
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-4xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                      {arcadeScore}
                  </div>
                  <div className="text-xs text-cyan-600 tracking-widest mt-1">SIMULATION MODE</div>
              </div>
              
              <button 
                onClick={() => setGameMode('solar')}
                className="absolute top-4 left-4 pointer-events-auto px-4 py-2 bg-gray-900/80 border border-red-500/50 text-red-400 text-xs hover:bg-red-900/20"
              >
                  ABORT SIMULATION
              </button>

              {arcadeGameOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
                      <div className="text-center p-8 border-2 border-red-500 bg-black rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                          <h2 className="text-4xl font-bold text-red-500 mb-2">CRITICAL FAILURE</h2>
                          <div className="text-2xl text-white mb-6 flex items-center justify-center gap-2">
                              <Trophy className="text-yellow-500" /> Score: {arcadeScore}
                          </div>
                          <div className="flex gap-4 justify-center">
                              <button 
                                onClick={startArcadeMinigame}
                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded"
                              >
                                  REBOOT SYSTEM
                              </button>
                              <button 
                                onClick={() => setGameMode('solar')}
                                className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-gray-400 rounded"
                              >
                                  EXIT
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Fire Button for Touch */}
              {!arcadeGameOver && (
                  <button 
                    onPointerDown={fireBullet}
                    className="absolute bottom-32 right-8 w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center text-red-400 active:bg-red-500/50 active:scale-95 transition-all pointer-events-auto touch-manipulation"
                  >
                      <Target size={32} />
                  </button>
              )}
          </div>
      )}

      {/* --- ORBIT SIM HUD --- */}
      {gameMode === 'orbit' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
             {/* Top Bar */}
             <div className="flex justify-between items-start">
                 <button 
                    onClick={() => setGameMode('solar')}
                    className="pointer-events-auto px-4 py-2 bg-gray-900/80 border border-blue-500/50 text-blue-400 text-xs hover:bg-blue-900/20 rounded"
                >
                    EXIT SIMULATOR
                </button>
                
                <div className="bg-black/80 p-3 rounded-lg border border-blue-500/30 text-right backdrop-blur flex gap-4">
                     <div className="flex gap-6 text-sm">
                        <div>
                            <div className="text-xs text-blue-400">ALTITUDE</div>
                            <div className="font-mono text-white">
                                {Math.max(0, Math.round(Math.sqrt(orbitSimRef.current.satellite.x**2 + orbitSimRef.current.satellite.y**2) - 40))} km
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-blue-400">VELOCITY</div>
                            <div className="font-mono text-white">
                                {Math.sqrt(orbitSimRef.current.satellite.vx**2 + orbitSimRef.current.satellite.vy**2).toFixed(2)} km/s
                            </div>
                        </div>
                     </div>
                     {orbitSimRef.current.status === 'escaped' && <div className="text-orange-400 text-xs font-bold mt-1">ORBIT ESCAPED</div>}
                     {orbitSimRef.current.status === 'crashed' && <div className="text-red-500 text-xs font-bold mt-1">IMPACT CONFIRMED</div>}
                </div>
             </div>

             {/* Zoom Controls */}
             <div className="absolute top-20 right-4 flex flex-col gap-2 pointer-events-auto">
                 <button 
                    onClick={() => setOrbitZoom(z => Math.min(z + 0.1, 2.0))}
                    className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                 >
                     <ZoomIn size={20} />
                 </button>
                 <button 
                    onClick={() => setOrbitZoom(z => Math.max(z - 0.1, 0.1))}
                    className="p-2 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                 >
                     <ZoomOut size={20} />
                 </button>
             </div>

             {/* Bottom Controls */}
             <div className="pointer-events-auto max-w-2xl mx-auto w-full bg-gray-900/90 border border-gray-700 rounded-xl p-4 backdrop-blur-lg shadow-2xl">
                 {orbitSimRef.current.status === 'ready' ? (
                     <div className="flex flex-col gap-4">
                         <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                             <h3 className="text-blue-400 font-bold flex items-center gap-2"><Settings2 size={16}/> MISSION PARAMETERS</h3>
                             <div className="flex gap-2">
                                 <button onClick={() => applyPreset('circular')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Circular</button>
                                 <button onClick={() => applyPreset('elliptical')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Elliptical</button>
                                 <button onClick={() => applyPreset('escape')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Escape</button>
                                 <button onClick={() => applyPreset('crash')} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300">Crash</button>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* Distance Control */}
                             <div className="space-y-1">
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Distance</span>
                                     <span>{orbitParams.distance} km</span>
                                 </div>
                                 <input 
                                     type="range" min="60" max="600" step="10"
                                     value={orbitParams.distance}
                                     onChange={(e) => {
                                         setOrbitParams(p => ({...p, distance: Number(e.target.value)}));
                                         orbitSimRef.current.satellite.x = Number(e.target.value);
                                     }}
                                     className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                 />
                             </div>

                             {/* Speed Control */}
                             <div className="space-y-1">
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Speed</span>
                                     <span>{orbitParams.speed} km/s</span>
                                 </div>
                                 <input 
                                     type="range" min="0" max="10" step="0.1"
                                     value={orbitParams.speed}
                                     onChange={(e) => setOrbitParams(p => ({...p, speed: Number(e.target.value)}))}
                                     className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                 />
                             </div>

                             {/* Angle Control */}
                             <div className="space-y-1">
                                 <div className="flex justify-between text-xs text-gray-400">
                                     <span>Angle</span>
                                     <span>{orbitParams.angle}°</span>
                                 </div>
                                 <input 
                                     type="range" min="-90" max="90" step="5"
                                     value={orbitParams.angle}
                                     onChange={(e) => setOrbitParams(p => ({...p, angle: Number(e.target.value)}))}
                                     className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                 />
                             </div>
                         </div>

                         <button 
                             onClick={launchOrbitSim}
                             className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                         >
                             <Play size={20} fill="currentColor" /> LAUNCH SATELLITE
                         </button>
                     </div>
                 ) : (
                     <div className="flex justify-center items-center gap-4">
                         <div className={`text-sm font-mono ${orbitSimRef.current.status === 'running' ? 'text-green-400' : 'text-gray-400'}`}>
                             STATUS: {orbitSimRef.current.status.toUpperCase()}
                         </div>
                         <button 
                             onClick={resetOrbitSim}
                             className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg border border-gray-600 flex items-center gap-2"
                         >
                             <RotateCcw size={16} /> CONFIGURE MISSION
                         </button>
                     </div>
                 )}
             </div>
          </div>
      )}

      {/* --- RAIDEN MODE HUD --- */}
      {gameMode === 'raiden' && (
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 pointer-events-auto">
                  <button 
                    onClick={() => setGameMode('solar')}
                    className="px-4 py-2 bg-red-900/80 border border-red-500/50 text-red-400 text-xs hover:bg-red-900/20"
                  >
                      ABORT MISSION
                  </button>
              </div>

              <div className="absolute top-4 right-4 text-right">
                  <div className="text-4xl font-mono font-bold text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                      {raidenScore}
                  </div>
                  <div className="text-xs text-red-800 tracking-widest mt-1">HOSTILES ELIMINATED</div>
              </div>

               {/* Powerup Status Icons */}
               <div className="absolute top-20 right-4 flex flex-col gap-2 items-end">
                  {raidenRef.current.player.weaponLevel > 1 && (
                      <div className="flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
                          WEAPON LVL {raidenRef.current.player.weaponLevel} <ChevronsUp size={16} />
                      </div>
                  )}
                  {raidenRef.current.player.speedLevel > 1 && (
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-bold animate-pulse">
                          SPEED BOOST x{raidenRef.current.player.speedLevel} <Zap size={16} />
                      </div>
                  )}
              </div>

              {/* Stats Bar */}
              <div className="absolute bottom-32 left-8 right-8 flex gap-4">
                  {/* Health Bar */}
                  <div className="flex-1 h-4 bg-gray-900 border border-gray-700 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                        style={{ width: `${Math.max(0, raidenHp)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80 gap-1">
                         <Heart size={10} fill="currentColor" /> HULL INTEGRITY: {Math.round(raidenHp)}%
                    </div>
                  </div>

                  {/* Shield Bar (Only if active) */}
                  {raidenShield > 0 && (
                      <div className="flex-1 h-4 bg-gray-900 border border-cyan-700 rounded-full overflow-hidden relative animate-in fade-in zoom-in duration-300">
                        <div 
                            className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-300"
                            style={{ width: `${Math.max(0, raidenShield)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-cyan-100 gap-1">
                            <Shield size={10} fill="currentColor" /> SHIELD: {Math.round(raidenShield)}%
                        </div>
                      </div>
                  )}
              </div>

              {raidenRef.current.gameOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
                      <div className="text-center p-8 border-2 border-red-500 bg-black rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                          <h2 className="text-4xl font-bold text-red-500 mb-2">MISSION FAILED</h2>
                          <div className="text-2xl text-white mb-6 flex items-center justify-center gap-2">
                              <Trophy className="text-yellow-500" /> Final Score: {raidenScore}
                          </div>
                          <div className="flex gap-4 justify-center">
                              <button 
                                onClick={startRaiden}
                                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
                              >
                                  RETRY MISSION
                              </button>
                              <button 
                                onClick={() => setGameMode('solar')}
                                className="px-6 py-3 border border-gray-600 hover:bg-gray-800 text-gray-400 rounded"
                              >
                                  RETURN TO BASE
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Shared Controls (Joystick & Debug) */}
      {gameMode !== 'orbit' && (
        <div className="absolute bottom-8 left-8 pointer-events-auto">
            <Joystick 
                onStart={handleInteraction}
                onMove={(vec) => { joystickVectorRef.current = vec; }} 
            />
        </div>
      )}

      {gameMode === 'solar' && (
        <div className="absolute bottom-8 right-8 pointer-events-auto">
            <div className="flex flex-col items-end gap-2 text-xs text-gray-500 font-mono">
                <div>POS X: {Math.round(shipRef.current.position.x)}</div>
                <div>POS Y: {Math.round(shipRef.current.position.y)}</div>
                <div>VEL: {Math.abs(Math.round(Math.sqrt(shipRef.current.velocity.x**2 + shipRef.current.velocity.y**2) * 10) / 10)}</div>
            </div>
        </div>
      )}
    </div>
  );
};
