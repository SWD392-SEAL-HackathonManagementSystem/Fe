import axiosClient from '../../../shared/api/axiosClient';
import { ENDPOINTS } from '../../../shared/api/endpoints';
import { mapTeamForCoordinator } from '../mapper/coordinatorTeam.mapper';

export const approvalService = {
  // 1. GET danh sách đội chờ duyệt (Status mặc định là PENDING)
  getTeamsForApproval: async (hackathonId, status = 'PENDING') => {
    const params = { hackathonId, status };
    const res = await axiosClient.get(ENDPOINTS.TEAMS.BASE, { params });
    
    // Chặn luồng data, đưa qua Mapper xử lý trước khi trả về cho UI
    if (res && Array.isArray(res)) {
      return res.map(mapTeamForCoordinator);
    } else if (res && Array.isArray(res.data)) {
      return res.data.map(mapTeamForCoordinator);
    }
    return [];
  },

  // 2. PATCH Duyệt nhanh (Shortcut -> ACTIVE)
  approveTeam: async (teamId) => {
    // API Shortcut theo FR-13
    return axiosClient.patch(ENDPOINTS.TEAMS.APPROVE(teamId));
  },

  // 3. PATCH Từ chối đội (Status -> REJECTED, kèm lý do)
  rejectTeam: async (teamId, rejectionReason) => {
    const payload = { status: 'REJECTED', rejectionReason };
    return axiosClient.patch(ENDPOINTS.TEAMS.STATUS(teamId), payload);
  },

  // 4. POST Duyệt hàng loạt (Bulk Approve)
  bulkApproveTeams: async (hackathonId, teamIds) => {
    const payload = { hackathonId, teamIds };
    return axiosClient.post(ENDPOINTS.TEAMS.BULK_APPROVE, payload);
  },

  // 5. DELETE Giải tán đội (Coordinator có quyền ép giải tán - FR-11D)
  disbandTeam: async (teamId) => {
    return axiosClient.delete(ENDPOINTS.TEAMS.DETAIL(teamId));
  }
};