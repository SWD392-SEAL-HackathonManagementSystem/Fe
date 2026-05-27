import { useState, useCallback } from 'react';
import { message, notification } from 'antd'; 
import { approvalService } from '../services/approval.service';
import { TEAM_ERROR_MESSAGES } from '../constants/team.constants';

export const useApproval = (hackathonId) => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchTeams = useCallback(async (status = 'PENDING') => {
    if (!hackathonId) return;
    setIsLoading(true);
    try {
      const data = await approvalService.getTeamsForApproval(hackathonId, status);
      setTeams(data);
    } catch (error) {
      notification.error({
        message: 'Lỗi tải dữ liệu',
        description: error.response?.data?.message || 'Không thể lấy danh sách đội thi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  const handleApprove = async (teamId) => {
    setIsActionLoading(true);
    try {
      await approvalService.approveTeam(teamId);
      message.success('Đã duyệt đội thành công!');
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      return true;
    } catch (error) {
      const errCode = error.response?.data?.code;
      message.error(TEAM_ERROR_MESSAGES[errCode] || 'Duyệt đội thất bại!');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (teamId, reason) => {
    setIsActionLoading(true);
    try {
      await approvalService.rejectTeam(teamId, reason);
      message.success('Đã từ chối đội!');
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      return true;
    } catch (error) {
      message.error('Có lỗi xảy ra khi từ chối đội.');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisband = async (teamId) => {
    setIsActionLoading(true);
    try {
      await approvalService.disbandTeam(teamId);
      message.success('Đã giải tán đội thành công.');
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
      return true;
    } catch (error) {
      const errCode = error.response?.data?.code;
      notification.error({
        message: 'Không thể giải tán',
        description: TEAM_ERROR_MESSAGES[errCode] || 'Đội đang có ràng buộc dữ liệu.',
      });
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkApprove = async (teamIds) => {
    setIsActionLoading(true);
    try {
      await approvalService.bulkApproveTeams(hackathonId, teamIds);
      message.success(`Đã duyệt thành công ${teamIds.length} đội!`);
      setTeams((prev) => prev.filter((team) => !teamIds.includes(team.id)));
      return true;
    } catch (error) {
      message.error('Có lỗi xảy ra khi duyệt hàng loạt.');
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    teams,
    isLoading,
    isActionLoading,
    fetchTeams,
    handleApprove,
    handleReject,
    handleDisband,
    handleBulkApprove,
  };
};