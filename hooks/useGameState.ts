import { useReducer, useCallback } from 'react';
import { getSettings, saveSettings, getHighScores } from '../utils/localStorage';
import { ChatMessage } from '../types';

export type GameMode = 'solar' | 'arcade' | 'orbit' | 'raiden';

export interface GameState {
  // Mode
  gameMode: GameMode;

  // Solar Mode
  autopilotActive: boolean;
  autopilotTarget: string | null;
  closestBody: string | null;
  aiDescription: string | null;
  isAiLoading: boolean;
  fuel: number; // Ship fuel level (0-100)

  // Arcade Mode
  arcadeScore: number;
  arcadeGameOver: boolean;
  arcadeHighScore: number;

  // Orbit Mode
  orbitParams: {
    speed: number;
    distance: number;
    angle: number;
  };
  orbitZoom: number;

  // Raiden Mode
  raidenScore: number;
  raidenHp: number;
  raidenShield: number;
  raidenHighScore: number;

  // Settings
  isMuted: boolean;

  // Chat
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  chatLoading: boolean;
}

type GameAction =
  | { type: 'SET_GAME_MODE'; payload: GameMode }
  | { type: 'SET_AUTOPILOT'; payload: { active: boolean; target: string | null } }
  | { type: 'SET_CLOSEST_BODY'; payload: string | null }
  | { type: 'SET_AI_DESCRIPTION'; payload: string | null }
  | { type: 'SET_AI_LOADING'; payload: boolean }
  | { type: 'SET_FUEL'; payload: number }
  | { type: 'SET_ARCADE_SCORE'; payload: number }
  | { type: 'SET_ARCADE_GAME_OVER'; payload: boolean }
  | { type: 'SET_ORBIT_PARAMS'; payload: Partial<GameState['orbitParams']> }
  | { type: 'SET_ORBIT_ZOOM'; payload: number }
  | { type: 'SET_RAIDEN_SCORE'; payload: number }
  | { type: 'SET_RAIDEN_HP'; payload: number }
  | { type: 'SET_RAIDEN_SHIELD'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'RESET_ARCADE' }
  | { type: 'RESET_RAIDEN' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'CLEAR_CHAT' };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload };

    case 'SET_AUTOPILOT':
      return {
        ...state,
        autopilotActive: action.payload.active,
        autopilotTarget: action.payload.target
      };

    case 'SET_CLOSEST_BODY':
      return { ...state, closestBody: action.payload };

    case 'SET_AI_DESCRIPTION':
      return { ...state, aiDescription: action.payload };

    case 'SET_AI_LOADING':
      return { ...state, isAiLoading: action.payload };

    case 'SET_FUEL':
      return { ...state, fuel: action.payload };

    case 'SET_ARCADE_SCORE':
      return {
        ...state,
        arcadeScore: action.payload,
        arcadeHighScore: Math.max(state.arcadeHighScore, action.payload)
      };

    case 'SET_ARCADE_GAME_OVER':
      return { ...state, arcadeGameOver: action.payload };

    case 'SET_ORBIT_PARAMS':
      return {
        ...state,
        orbitParams: { ...state.orbitParams, ...action.payload }
      };

    case 'SET_ORBIT_ZOOM':
      return { ...state, orbitZoom: action.payload };

    case 'SET_RAIDEN_SCORE':
      return {
        ...state,
        raidenScore: action.payload,
        raidenHighScore: Math.max(state.raidenHighScore, action.payload)
      };

    case 'SET_RAIDEN_HP':
      return { ...state, raidenHp: action.payload };

    case 'SET_RAIDEN_SHIELD':
      return { ...state, raidenShield: action.payload };

    case 'TOGGLE_MUTE':
      const newMuted = !state.isMuted;
      saveSettings({ isMuted: newMuted });
      return { ...state, isMuted: newMuted };

    case 'RESET_ARCADE':
      return {
        ...state,
        arcadeScore: 0,
        arcadeGameOver: false
      };

    case 'RESET_RAIDEN':
      return {
        ...state,
        raidenScore: 0,
        raidenHp: 100,
        raidenShield: 0
      };

    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen };

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };

    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.payload };

    case 'CLEAR_CHAT':
      return { ...state, chatMessages: [], chatOpen: false };

    default:
      return state;
  }
};

export const useGameState = () => {
  const settings = getSettings();
  const highScores = getHighScores();

  const initialState: GameState = {
    gameMode: 'solar',
    autopilotActive: false,
    autopilotTarget: null,
    closestBody: null,
    aiDescription: null,
    isAiLoading: false,
    fuel: 100,
    arcadeScore: 0,
    arcadeGameOver: false,
    arcadeHighScore: highScores.arcade,
    orbitParams: {
      speed: 3.0,
      distance: 250,
      angle: 0
    },
    orbitZoom: 0.8,
    raidenScore: 0,
    raidenHp: 100,
    raidenShield: 0,
    raidenHighScore: highScores.raiden,
    isMuted: settings.isMuted,
    chatMessages: [],
    chatOpen: false,
    chatLoading: false
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Action creators
  const setGameMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'SET_GAME_MODE', payload: mode });
  }, []);

  const setAutopilot = useCallback((active: boolean, target: string | null = null) => {
    dispatch({ type: 'SET_AUTOPILOT', payload: { active, target } });
  }, []);

  const setClosestBody = useCallback((body: string | null) => {
    dispatch({ type: 'SET_CLOSEST_BODY', payload: body });
  }, []);

  const setAiDescription = useCallback((description: string | null) => {
    dispatch({ type: 'SET_AI_DESCRIPTION', payload: description });
  }, []);

  const setAiLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_AI_LOADING', payload: loading });
  }, []);

  const setFuel = useCallback((fuel: number) => {
    dispatch({ type: 'SET_FUEL', payload: fuel });
  }, []);

  const setArcadeScore = useCallback((score: number) => {
    dispatch({ type: 'SET_ARCADE_SCORE', payload: score });
  }, []);

  const setArcadeGameOver = useCallback((gameOver: boolean) => {
    dispatch({ type: 'SET_ARCADE_GAME_OVER', payload: gameOver });
  }, []);

  const setOrbitParams = useCallback((params: Partial<GameState['orbitParams']>) => {
    dispatch({ type: 'SET_ORBIT_PARAMS', payload: params });
  }, []);

  const setOrbitZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ORBIT_ZOOM', payload: zoom });
  }, []);

  const setRaidenScore = useCallback((score: number) => {
    dispatch({ type: 'SET_RAIDEN_SCORE', payload: score });
  }, []);

  const setRaidenHp = useCallback((hp: number) => {
    dispatch({ type: 'SET_RAIDEN_HP', payload: hp });
  }, []);

  const setRaidenShield = useCallback((shield: number) => {
    dispatch({ type: 'SET_RAIDEN_SHIELD', payload: shield });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const resetArcade = useCallback(() => {
    dispatch({ type: 'RESET_ARCADE' });
  }, []);

  const resetRaiden = useCallback(() => {
    dispatch({ type: 'RESET_RAIDEN' });
  }, []);

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
  }, []);

  const setChatLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_CHAT_LOADING', payload: loading });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  return {
    state,
    setGameMode,
    setAutopilot,
    setClosestBody,
    setAiDescription,
    setAiLoading,
    setFuel,
    setArcadeScore,
    setArcadeGameOver,
    setOrbitParams,
    setOrbitZoom,
    setRaidenScore,
    setRaidenHp,
    setRaidenShield,
    toggleMute,
    resetArcade,
    resetRaiden,
    toggleChat,
    addChatMessage,
    setChatLoading,
    clearChat,
  };
};
