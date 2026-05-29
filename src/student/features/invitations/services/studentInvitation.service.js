import axiosClient from '../../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../../shared/api/endpoints';
import { mapTeamToInvitation } from '../mapper/studentInvitation.mapper';

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

export const studentInvitationService = {
  getInvitations: async ({ hackathonId, status } = {}) => {
    const res = await axiosClient.get(ENDPOINTS.TEAMS.BASE, {
      params: { hackathonId, status },
    });
    return unwrapList(res).map(mapTeamToInvitation).filter(Boolean);
  },

  respondInvitation: async ({ teamId, userId, action }) => {
    return axiosClient.patch(ENDPOINTS.TEAMS.MEMBER_DETAIL(teamId, userId), { action });
  },
};
