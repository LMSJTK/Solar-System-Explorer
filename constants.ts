
import { CelestialBody } from './types';

export const SCALE_FACTOR = 1; // General scale adjustment
export const SHIP_ACCELERATION = 0.2;
export const SHIP_FRICTION = 0.98; // Space drag for playability
export const SHIP_ROTATION_SPEED = 0.1;
export const MAX_SPEED = 8;

// A "fun" scale solar system (not astronomically accurate, but visually pleasing for a game)
export const INITIAL_BODIES: CelestialBody[] = [
  {
    name: 'Sun',
    color: '#FDB813',
    radius: 60,
    orbitRadius: 0,
    orbitSpeed: 0,
    angle: 0,
  },
  {
    name: 'Mercury',
    color: '#A5A5A5',
    radius: 8,
    orbitRadius: 140,
    orbitSpeed: 0.02,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Venus',
    color: '#E3BB76',
    radius: 12,
    orbitRadius: 220,
    orbitSpeed: 0.015,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Earth',
    color: '#22A6B3',
    radius: 13,
    orbitRadius: 320,
    orbitSpeed: 0.01,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Mars',
    color: '#EB4D4B',
    radius: 10,
    orbitRadius: 420,
    orbitSpeed: 0.008,
    angle: Math.random() * Math.PI * 2,
  },
  // Asteroid Belt sits here ~500
  {
    name: 'Ceres',
    color: '#8c8c8c',
    radius: 4, // Dwarf planet
    orbitRadius: 520,
    orbitSpeed: 0.007,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Jupiter',
    color: '#D980FA',
    radius: 35,
    orbitRadius: 680, // Pushed out slightly for asteroid belt
    orbitSpeed: 0.004,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Saturn',
    color: '#F7D794',
    radius: 30,
    orbitRadius: 950,
    orbitSpeed: 0.003,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Uranus',
    color: '#7ED6DF',
    radius: 20,
    orbitRadius: 1200,
    orbitSpeed: 0.002,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Neptune',
    color: '#30336B',
    radius: 19,
    orbitRadius: 1400,
    orbitSpeed: 0.0015,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Pluto',
    color: '#D4A373',
    radius: 5,
    orbitRadius: 1600,
    orbitSpeed: 0.0012,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Haumea',
    color: '#EEEEEE',
    radius: 5, // In reality oval, simplified to circle
    orbitRadius: 1800,
    orbitSpeed: 0.001,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Makemake',
    color: '#BC6C25',
    radius: 5,
    orbitRadius: 2000,
    orbitSpeed: 0.0009,
    angle: Math.random() * Math.PI * 2,
  },
  {
    name: 'Eris',
    color: '#F4F4F9',
    radius: 6,
    orbitRadius: 2200,
    orbitSpeed: 0.0008,
    angle: Math.random() * Math.PI * 2,
  },
];
