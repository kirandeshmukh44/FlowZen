import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { soundEngine } from '../lib/sound';

const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem('flowzen_sound_volume');
      return saved !== null ? parseFloat(saved) : 0.3;
    } catch (e) {
      return 0.3;
    }
  });

  const [isMuted, setIsMutedState] = useState(() => {
    try {
      const saved = localStorage.getItem('flowzen_sound_muted');
      return saved !== null ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    try {
      localStorage.setItem('flowzen_sound_volume', clamped.toString());
    } catch (e) {}
  };

  const setIsMuted = (muted) => {
    setIsMutedState(muted);
    try {
      localStorage.setItem('flowzen_sound_muted', JSON.stringify(muted));
    } catch (e) {}
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Sound triggering functions passing current volume and mute state
  const playClick = useCallback(() => soundEngine.playClick(volume, isMuted), [volume, isMuted]);
  const playToggle = useCallback((isOpening = true) => soundEngine.playToggle(isOpening, volume, isMuted), [volume, isMuted]);
  const playHover = useCallback(() => soundEngine.playHover(volume, isMuted), [volume, isMuted]);
  const playSuccess = useCallback(() => soundEngine.playSuccess(volume, isMuted), [volume, isMuted]);
  const playError = useCallback(() => soundEngine.playError(volume, isMuted), [volume, isMuted]);
  const playNotification = useCallback(() => soundEngine.playNotification(volume, isMuted), [volume, isMuted]);
  const playDragPickup = useCallback(() => soundEngine.playDragPickup(volume, isMuted), [volume, isMuted]);
  const playDrop = useCallback(() => soundEngine.playDrop(volume, isMuted), [volume, isMuted]);
  const playDrawer = useCallback((isOpen = true) => soundEngine.playDrawer(isOpen, volume, isMuted), [volume, isMuted]);
  const playTimer = useCallback((isStarting = true) => soundEngine.playTimer(isStarting, volume, isMuted), [volume, isMuted]);
  const playLevelUp = useCallback(() => soundEngine.playLevelUp(volume, isMuted), [volume, isMuted]);

  return (
    <SoundContext.Provider
      value={{
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        toggleMute,
        playClick,
        playToggle,
        playHover,
        playSuccess,
        playError,
        playNotification,
        playDragPickup,
        playDrop,
        playDrawer,
        playTimer,
        playLevelUp,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

export default useSound;

