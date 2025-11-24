/**
 * LocalStorage utility for persisting game data
 */

const STORAGE_KEYS = {
  ARCADE_HIGH_SCORE: 'solar_explorer_arcade_high_score',
  RAIDEN_HIGH_SCORE: 'solar_explorer_raiden_high_score',
  VISITED_PLANETS: 'solar_explorer_visited_planets',
  SETTINGS: 'solar_explorer_settings',
} as const;

export interface GameSettings {
  isMuted: boolean;
}

export interface HighScores {
  arcade: number;
  raiden: number;
}

export interface VisitedPlanets {
  [planetName: string]: {
    visitCount: number;
    lastVisited: number; // timestamp
  };
}

/**
 * Get high scores from localStorage
 */
export const getHighScores = (): HighScores => {
  try {
    const arcade = localStorage.getItem(STORAGE_KEYS.ARCADE_HIGH_SCORE);
    const raiden = localStorage.getItem(STORAGE_KEYS.RAIDEN_HIGH_SCORE);
    return {
      arcade: arcade ? parseInt(arcade, 10) : 0,
      raiden: raiden ? parseInt(raiden, 10) : 0,
    };
  } catch (error) {
    console.warn('Failed to load high scores:', error);
    return { arcade: 0, raiden: 0 };
  }
};

/**
 * Save arcade high score
 */
export const saveArcadeHighScore = (score: number): void => {
  try {
    const currentHigh = getHighScores().arcade;
    if (score > currentHigh) {
      localStorage.setItem(STORAGE_KEYS.ARCADE_HIGH_SCORE, score.toString());
    }
  } catch (error) {
    console.warn('Failed to save arcade high score:', error);
  }
};

/**
 * Save raiden high score
 */
export const saveRaidenHighScore = (score: number): void => {
  try {
    const currentHigh = getHighScores().raiden;
    if (score > currentHigh) {
      localStorage.setItem(STORAGE_KEYS.RAIDEN_HIGH_SCORE, score.toString());
    }
  } catch (error) {
    console.warn('Failed to save raiden high score:', error);
  }
};

/**
 * Get visited planets
 */
export const getVisitedPlanets = (): VisitedPlanets => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VISITED_PLANETS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.warn('Failed to load visited planets:', error);
    return {};
  }
};

/**
 * Mark a planet as visited
 */
export const markPlanetVisited = (planetName: string): void => {
  try {
    const visited = getVisitedPlanets();
    visited[planetName] = {
      visitCount: (visited[planetName]?.visitCount || 0) + 1,
      lastVisited: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.VISITED_PLANETS, JSON.stringify(visited));
  } catch (error) {
    console.warn('Failed to mark planet as visited:', error);
  }
};

/**
 * Check if a planet has been visited before
 */
export const hasPlanetBeenVisited = (planetName: string): boolean => {
  const visited = getVisitedPlanets();
  return !!visited[planetName];
};

/**
 * Get game settings
 */
export const getSettings = (): GameSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { isMuted: false };
  } catch (error) {
    console.warn('Failed to load settings:', error);
    return { isMuted: false };
  }
};

/**
 * Save game settings
 */
export const saveSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
};

/**
 * Clear all game data (for debugging/reset)
 */
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear data:', error);
  }
};
