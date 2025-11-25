
export interface Vector2D {
  x: number;
  y: number;
}

export interface CelestialBody {
  name: string;
  color: string;
  radius: number; // Visual size
  orbitRadius: number; // Distance from sun
  orbitSpeed: number; // Speed of orbit
  angle: number; // Current orbit angle (radians)
}

export interface Asteroid {
  x: number;
  y: number;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  rotation: number;
  rotationSpeed: number;
  shape: number[]; // Array of radius multipliers for irregular shape
}

export interface ShipState {
  position: Vector2D;
  velocity: Vector2D;
  rotation: number;
  thrusting: boolean;
  trail?: Vector2D[]; // Optional trail for visual effect
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export type AutopilotTarget = string | null; // Name of the target planet

// --- Minigame Types ---

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface MinigameAsteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // Radius
  tier: number; // 3 (Large), 2 (Med), 1 (Small)
  shape: number[];
  rotation: number;
  rotationSpeed: number;
  shapeType?: 'rock' | 'ship'; // For differentiating in render if needed
}

export interface OrbitSimState {
  satellite: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  trail: {x: number, y: number}[];
  status: 'ready' | 'running' | 'crashed' | 'escaped';
}

// --- Raiden (Mars) Minigame Types ---

export interface RaidenPowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: 'health' | 'spread' | 'speed' | 'shield';
}

export interface RaidenState {
  player: { 
    x: number; 
    y: number; 
    hp: number; 
    maxHp: number; 
    cooldown: number;
    weaponLevel: number; // 1: Single, 2: Double, 3: Spread
    speedLevel: number; 
    shield: number; // Extra HP layer
  };
  enemies: RaidenEnemy[];
  bullets: RaidenBullet[];
  particles: RaidenParticle[];
  powerups: RaidenPowerUp[];
  score: number;
  gameOver: boolean;
  scroll: number;
  waveTimer: number;
}

export interface RaidenEnemy {
  id: number;
  x: number;
  y: number;
  type: 'scout' | 'heavy' | 'interceptor';
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  cooldown: number;
}

export interface RaidenBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  damage: number;
  color: string;
}

export interface RaidenParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// --- Ship Computer Chat Types ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  planet?: string; // Context: which planet was nearby when message was sent
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
}
