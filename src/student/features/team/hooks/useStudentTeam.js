import { useCallback, useEffect, useState } from 'react';
import { message, notification } from 'antd';
import { getStudentTeamErrorMessage } from '../constants/studentTeam.constants';
import { studentTeamService } from '../services/studentTeam.service';

const getCurrentUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
};

const showLargeTeamNotice = ({ type = 'error', message: title, description }) => {
  notification[type]({
    message: title,
    description,
    placement: 'top',
    duration: 6,
    style: {
      width: 420,
      maxWidth: 'calc(100vw - 32px)',
      borderRadius: 14,
      boxShadow: '0 14px 36px rgba(15, 23, 42, 0.14)',
    },
  });
};

const isKnownUnauthorizedCreator = (userInfo) => {
  if (!userInfo?.role && !userInfo?.status) return false;
  return userInfo.role !== 'STUDENT' || userInfo.status !== 'APPROVED';
};

export const useStudentTeam = (initialHackathonId) => {
  const [hackathonId, setHackathonId] = useState(initialHackathonId || '');
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) || teams[0] || null;

  const replaceTeam = (nextTeam) => {
    if (!nextTeam) return;
    setTeams((prev) => {
      const exists = prev.some((team) => team.id === nextTeam.id);
      if (!exists) return [nextTeam, ...prev];
      return prev.map((team) => (team.id === nextTeam.id ? nextTeam : team));
    });
    setSelectedTeamId(nextTeam.id);
  };

  const fetchTeams = useCallback(async () => {
    if (!hackathonId) {
      setTeams([]);
      setSelectedTeamId(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await studentTeamService.getMyTeams({ hackathonId });
      setTeams(data);
      setSelectedTeamId((currentId) => currentId || data[0]?.id || null);
    } catch (error) {
      showLargeTeamNotice({
        message: 'Không thể tải đội của bạn',
        description: getStudentTeamErrorMessage(error, 'Vui lòng thử lại sau.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchTeams();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTeams]);

  const refreshSelectedTeam = async (teamId = selectedTeam?.id) => {
    if (!teamId) return null;
    const detail = await studentTeamService.getTeamDetail(teamId);
    replaceTeam(detail);
    return detail;
  };

  const createTeam = async (payload) => {
    const userInfo = getCurrentUserInfo();
    if (isKnownUnauthorizedCreator(userInfo)) {
      showLargeTeamNotice({
        type: 'warning',
        message: 'Chưa thể tạo đội',
        description: `Tài khoản cần là sinh viên đã được phê duyệt. Trạng thái hiện tại: ${userInfo.status || 'chưa xác định'}.`,
      });
      return false;
    }

    setIsActionLoading(true);
    try {
      const team = await studentTeamService.createTeam(payload);
      setHackathonId(payload.hackathonId || '');
      replaceTeam(team);
      message.success('Đã tạo đội thành công.');
      return true;
    } catch (error) {
      showLargeTeamNotice({
        message: 'Tạo đội không thành công',
        description: getStudentTeamErrorMessage(error, 'Tạo đội thất bại. Vui lòng kiểm tra lại quyền tài khoản và hackathon.'),
      });
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const inviteMember = async (teamId, email) => {
    setIsActionLoading(true);
    try {
      await studentTeamService.inviteMember(teamId, email);
      await refreshSelectedTeam(teamId);
      message.success('Đã gửi lời mời thành viên.');
      return true;
    } catch (error) {
      message.error(getStudentTeamErrorMessage(error, 'Mời thành viên thất bại.'));
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const cancelPendingInvite = async (teamId, userId) => {
    setIsActionLoading(true);
    try {
      await studentTeamService.cancelPendingInvite(teamId, userId);
      await refreshSelectedTeam(teamId);
      message.success('Đã hủy lời mời đang chờ.');
      return true;
    } catch (error) {
      message.error(getStudentTeamErrorMessage(error, 'Không thể hủy lời mời.'));
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const transferLeader = async (teamId, newLeaderId) => {
    setIsActionLoading(true);
    try {
      const team = await studentTeamService.transferLeader(teamId, newLeaderId);
      replaceTeam(team);
      message.success('Đã chuyển quyền trưởng nhóm.');
      return true;
    } catch (error) {
      message.error(getStudentTeamErrorMessage(error, 'Chuyển quyền thất bại.'));
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  const disbandTeam = async (teamId) => {
    setIsActionLoading(true);
    try {
      await studentTeamService.disbandTeam(teamId);
      await fetchTeams();
      message.success('Đã giải tán đội.');
      return true;
    } catch (error) {
      notification.error({
        message: 'Không thể giải tán đội',
        description: getStudentTeamErrorMessage(error, 'Đội đang có ràng buộc nghiệp vụ.'),
      });
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    hackathonId,
    setHackathonId,
    teams,
    selectedTeam,
    selectedTeamId,
    setSelectedTeamId,
    isLoading,
    isActionLoading,
    fetchTeams,
    createTeam,
    inviteMember,
    cancelPendingInvite,
    transferLeader,
    disbandTeam,
  };
};
