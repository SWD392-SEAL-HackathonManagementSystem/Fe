import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';

export const reviewService = {
  checkReadiness: async (hackathonId, targetStatus = 'ONGOING') => {
    return axiosClient.get(ENDPOINTS.HACKATHONS.READINESS(hackathonId), {
      params: { target: targetStatus }
    });
  },

  changeStatus: async (hackathonId, targetStatus) => {
    return axiosClient.patch(ENDPOINTS.HACKATHONS.STATUS(hackathonId), { targetStatus });
  }
};