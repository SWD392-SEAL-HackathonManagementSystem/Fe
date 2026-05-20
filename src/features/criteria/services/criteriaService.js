import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const criteriaService = {
  listByTrack: async (trackId) => {
    return axiosClient.get(`${ENDPOINTS.TRACKS.CRITERIA(trackId)}`);
  },
  
  listByFinalRound: async (roundId) => {
    return axiosClient.get(`${ENDPOINTS.ROUNDS.CRITERIA(roundId)}`);
  },
  
  createForTrack: async (trackId, data) => {
    return axiosClient.post(`${ENDPOINTS.TRACKS.CRITERIA(trackId)}`, data);
  },
  
  createForFinalRound: async (roundId, data) => {
    return axiosClient.post(`${ENDPOINTS.ROUNDS.CRITERIA(roundId)}`, data);
  },

  cloneForTrack: async (trackId, data) => {
    return axiosClient.post(ENDPOINTS.TRACKS.CRITERIA_CLONE(trackId), data);
  },

  cloneForFinalRound: async (roundId, data) => {
    return axiosClient.post(ENDPOINTS.ROUNDS.CRITERIA_CLONE(roundId), data);
  },
  
  getById: async (id) => {
    return axiosClient.get(ENDPOINTS.CRITERIA.DETAIL(id));
  },
  
  update: async (id, data) => {
    return axiosClient.put(ENDPOINTS.CRITERIA.DETAIL(id), data);
  },
  
  delete: async (id) => {
    return axiosClient.delete(ENDPOINTS.CRITERIA.DETAIL(id));
  }
};
