import axiosClient from '../../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../../shared/api/endpoints';
import { mapStudentTeam } from '../mapper/studentTeam.mapper';

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

const unwrapItem = (res) => res?.data || res || null;

export const studentTeamService = {
  getMyTeams: async ({ hackathonId, status } = {}) => {
    const params = { hackathonId, status };
    const res = await axiosClient.get(ENDPOINTS.TEAMS.BASE, { params });
    return unwrapList(res).map(mapStudentTeam).filter(Boolean);
  },

  getTeamDetail: async (teamId) => {
    const res = await axiosClient.get(ENDPOINTS.TEAMS.DETAIL(teamId));
    return mapStudentTeam(unwrapItem(res));
  },

  createTeam: async ({ hackathonId, teamName }) => {
    const res = await axiosClient.post(ENDPOINTS.TEAMS.BASE, { hackathonId, teamName });
    return mapStudentTeam(unwrapItem(res));
  },

  inviteMember: async (teamId, email) => {
    return axiosClient.post(ENDPOINTS.TEAMS.INVITE_MEMBER(teamId), { email });
  },

  cancelPendingInvite: async (teamId, userId) => {
    return axiosClient.delete(ENDPOINTS.TEAMS.MEMBER_DETAIL(teamId, userId));
  },

  transferLeader: async (teamId, newLeaderId) => {
    const res = await axiosClient.patch(ENDPOINTS.TEAMS.TRANSFER_LEADER(teamId), { newLeaderId });
    return mapStudentTeam(unwrapItem(res));
  },

  disbandTeam: async (teamId) => {
    return axiosClient.delete(ENDPOINTS.TEAMS.DETAIL(teamId));
  },
};
