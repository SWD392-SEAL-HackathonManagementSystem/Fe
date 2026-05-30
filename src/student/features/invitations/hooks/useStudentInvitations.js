import { useCallback, useMemo, useState } from 'react';
import { message, notification } from 'antd';
import { getInvitationErrorMessage } from '../constants/studentInvitation.constants';
import { studentInvitationService } from '../services/studentInvitation.service';

const notifyError = (title, error, fallback) => {
  notification.error({
    message: title,
    description: getInvitationErrorMessage(error, fallback),
    placement: 'top',
    duration: 6,
    style: { width: 420, maxWidth: 'calc(100vw - 32px)', borderRadius: 14 },
  });
};

export const useStudentInvitations = (initialHackathonId) => {
  const [hackathonId, setHackathonId] = useState(initialHackathonId || '');
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionKey, setActionKey] = useState('');

  const pendingCount = useMemo(
    () => invitations.filter((item) => item.memberStatus === 'PENDING').length,
    [invitations]
  );

  const fetchInvitations = useCallback(async () => {
    if (!hackathonId) {
      setInvitations([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await studentInvitationService.getInvitations({ hackathonId });
      setInvitations(data);
    } catch (error) {
      notifyError('Không thể tải lời mời', error, 'Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  const respondInvitation = async (invitation, action) => {
    const key = `${invitation.teamId}-${action}`;
    setActionKey(key);
    try {
      await studentInvitationService.respondInvitation({
        teamId: invitation.teamId,
        userId: invitation.userId,
        action,
      });
      await fetchInvitations();
      message.success('Đã cập nhật phản hồi lời mời.');
      return true;
    } catch (error) {
      notifyError('Không thể phản hồi lời mời', error, 'Thao tác thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      setActionKey('');
    }
  };

  return {
    hackathonId,
    setHackathonId,
    invitations,
    pendingCount,
    isLoading,
    actionKey,
    fetchInvitations,
    respondInvitation,
  };
};
