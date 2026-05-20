import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const trackService = {
  listByHackathon: async (hackathonId) => {
    return axiosClient.get(ENDPOINTS.HACKATHONS.TRACKS(hackathonId));
  },
  
  listByRound: async (roundId) => {
    return axiosClient.get(ENDPOINTS.ROUNDS.TRACKS(roundId));
  },
  
  getById: async (id) => {
    return axiosClient.get(ENDPOINTS.TRACKS.DETAIL(id));
  },
  
  createByRound: async (roundId, data) => {
    return axiosClient.post(ENDPOINTS.ROUNDS.TRACKS(roundId), data);
  },
  
  update: async (id, data) => {
    return axiosClient.put(ENDPOINTS.TRACKS.DETAIL(id), data);
  },
  
  delete: async (id) => {
    return axiosClient.delete(ENDPOINTS.TRACKS.DETAIL(id));
  }
};
