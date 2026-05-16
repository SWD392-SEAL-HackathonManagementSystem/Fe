import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_HACKATHONS } from '../features/hackathons/data/hackathon.mock';
import { MOCK_TRACKS } from '../features/tracks/data/track.mock';
import { MOCK_ROUNDS } from '../features/rounds/data/round.mock';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [hackathons, setHackathons] = useState(() => {
    const saved = localStorage.getItem('hackathons');
    return saved ? JSON.parse(saved) : MOCK_HACKATHONS;
  });

  const [tracks, setTracks] = useState(() => {
    const saved = localStorage.getItem('tracks');
    return saved ? JSON.parse(saved) : MOCK_TRACKS;
  });

  const [rounds, setRounds] = useState(() => {
    const saved = localStorage.getItem('rounds');
    return saved ? JSON.parse(saved) : MOCK_ROUNDS;
  });

  useEffect(() => {
    localStorage.setItem('hackathons', JSON.stringify(hackathons));
  }, [hackathons]);

  useEffect(() => {
    localStorage.setItem('tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('rounds', JSON.stringify(rounds));
  }, [rounds]);

  // Hackathon actions
  const addHackathon = (hackathon) => {
    const newHackathon = {
      ...hackathon,
      id: hackathons.length > 0 ? Math.max(...hackathons.map(h => h.id)) + 1 : 1,
      status: 'DRAFT'
    };
    setHackathons([...hackathons, newHackathon]);
    return newHackathon;
  };

  const updateHackathon = (id, updates) => {
    setHackathons(hackathons.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHackathon = (id) => {
    setHackathons(hackathons.filter(h => h.id !== id));
    setTracks(tracks.filter(t => t.hackathon_id !== id));
    // Rounds are linked to tracks, so we need to filter them too
    const trackIds = tracks.filter(t => t.hackathon_id === id).map(t => t.id);
    setRounds(rounds.filter(r => !trackIds.includes(r.track_id)));
  };

  // Track actions
  const addTrack = (track) => {
    const newTrack = {
      ...track,
      id: tracks.length > 0 ? Math.max(...tracks.map(t => t.id)) + 1 : 1,
      status: 'OPEN'
    };
    setTracks([...tracks, newTrack]);
    return newTrack;
  };

  const updateTrack = (id, updates) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrack = (id) => {
    setTracks(tracks.filter(t => t.id !== id));
    setRounds(rounds.filter(r => r.track_id !== id));
  };

  // Round actions
  const addRound = (round) => {
    const newRound = {
      ...round,
      id: rounds.length > 0 ? Math.max(...rounds.map(r => r.id)) + 1 : 1,
      is_active: false,
      tiebreak_rule: round.tiebreak_rule || 'PENALTY_SCORE'
    };
    setRounds([...rounds, newRound]);
    return newRound;
  };

  const updateRound = (id, updates) => {
    setRounds(rounds.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRound = (id) => {
    setRounds(rounds.filter(r => r.id !== id));
  };

  return (
    <AppContext.Provider value={{
      hackathons, addHackathon, updateHackathon, deleteHackathon,
      tracks, addTrack, updateTrack, deleteTrack,
      rounds, addRound, updateRound, deleteRound
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
