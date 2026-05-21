import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

import { mapCriterionToFE, mapCriterionToBE } from '../mappers/criteriaMapper';

export const criteriaService = {
  // 1. GET list criteria theo Track (Sơ loại)
  listByTrack: async (trackId) => {
    const res = await axiosClient.get(ENDPOINTS.TRACKS.CRITERIA(trackId));
    // res là { items: [...], weightSummary: {...} }
    if (res && Array.isArray(res.items)) {
      return res.items.map(mapCriterionToFE);
    }
    return [];
  },

  // 2. GET list criteria theo Round (Chung kết)
  listByFinalRound: async (roundId) => {
    const res = await axiosClient.get(ENDPOINTS.ROUNDS.CRITERIA(roundId));
    if (res && Array.isArray(res.items)) {
      return res.items.map(mapCriterionToFE);
    }
    return [];
  },

  // 3. POST tạo mới criteria cho Track (Sơ loại)
  createForTrack: async (trackId, data) => {
    return axiosClient.post(ENDPOINTS.TRACKS.CRITERIA(trackId), mapCriterionToBE(data));
  },

  // 4. POST tạo mới criteria cho Round (Chung kết)
  createForFinalRound: async (roundId, data) => {
    return axiosClient.post(ENDPOINTS.ROUNDS.CRITERIA(roundId), mapCriterionToBE(data));
  },

  // 5. POST clone criteria cho Track
  cloneForTrack: async (trackId, data) => {
    return axiosClient.post(ENDPOINTS.TRACKS.CRITERIA_CLONE(trackId), data);
  },

  // 6. POST clone criteria cho Round (Chung kết)
  cloneForFinalRound: async (roundId, data) => {
    return axiosClient.post(ENDPOINTS.ROUNDS.CRITERIA_CLONE(roundId), data);
  },

  // 7. GET chi tiết 1 criteria
  getById: async (id) => {
    const res = await axiosClient.get(ENDPOINTS.CRITERIA.DETAIL(id));
    return mapCriterionToFE(res);
  },

  // 8. PUT cập nhật criteria
  update: async (id, data) => {
    return axiosClient.put(ENDPOINTS.CRITERIA.DETAIL(id), mapCriterionToBE(data));
  },

  // 9. DELETE xóa criteria
  delete: async (id) => {
    return axiosClient.delete(ENDPOINTS.CRITERIA.DETAIL(id));
  },

  // 10. GET weight summary theo Track
  getWeightSummaryByTrack: async (trackId) => {
    return axiosClient.get(`${ENDPOINTS.TRACKS.CRITERIA(trackId)}/weight-summary`);
  },

  // 11. GET weight summary theo Round (Chung kết)
  getWeightSummaryByRound: async (roundId) => {
    return axiosClient.get(`${ENDPOINTS.ROUNDS.CRITERIA(roundId)}/weight-summary`);
  },
};
