import axiosClient from '../../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../../shared/api/endpoints';

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const studentHackathonService = {
  browse: async (status = 'ONGOING') => {
    const res = await axiosClient.get(ENDPOINTS.STUDENT_HACKATHONS.BROWSE, {
      params: status ? { status } : undefined,
    });
    return unwrapList(res);
  },

  register: async (hackathonId) => {
    return axiosClient.post(ENDPOINTS.STUDENT_HACKATHONS.REGISTER(hackathonId));
  },

  unregister: async (hackathonId) => {
    return axiosClient.delete(ENDPOINTS.STUDENT_HACKATHONS.REGISTER(hackathonId));
  },
};
