import { useEffect } from 'react';
import { getPlanetDescription } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { markPlanetVisited } from '../utils/localStorage';

interface UseShipComputerProps {
  closestBody: string | null;
  gameMode: string;
  onDescriptionChange: (description: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

/**
 * Custom hook to handle AI scanning and descriptions
 */
export const useShipComputer = ({
  closestBody,
  gameMode,
  onDescriptionChange,
  onLoadingChange,
}: UseShipComputerProps) => {
  useEffect(() => {
    if (gameMode !== 'solar') return;

    if (!closestBody) {
      onDescriptionChange(null);
      onLoadingChange(false);
      return;
    }

    audioService.playAlert();
    onDescriptionChange(null);
    onLoadingChange(true);

    // Mark planet as visited
    markPlanetVisited(closestBody);

    let isCancelled = false;
    const scanTimer = setTimeout(() => {
      getPlanetDescription(closestBody, false).then(desc => {
        if (!isCancelled) {
          onDescriptionChange(desc);
          onLoadingChange(false);
        }
      });
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(scanTimer);
    };
  }, [closestBody, gameMode, onDescriptionChange, onLoadingChange]);
};
