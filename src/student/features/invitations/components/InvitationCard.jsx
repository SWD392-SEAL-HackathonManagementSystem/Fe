import { Button, Card, Modal, Progress, Space, Tag, Typography, theme } from 'antd';
import { CheckOutlined, CloseOutlined, TeamOutlined } from '@ant-design/icons';
import { INVITATION_ACTION } from '../constants/studentInvitation.constants';

const { Text, Title } = Typography;

const InvitationCard = ({ invitation, actionKey, onRespond }) => {
  const { token } = theme.useToken();
  const loading = (action) => actionKey === `${invitation.teamId}-${action}`;
  const progressPercent = Math.min(100, Math.round((invitation.acceptedMemberCount / 5) * 100));
  const isPending = invitation.memberStatus === 'PENDING';

  const confirmAction = (action, title) => {
    Modal.confirm({
      title,
      content: `Đội: ${invitation.teamName}`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => onRespond(invitation, action),
    });
  };

  return (
    <Card
      hoverable
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-4px)';
        event.currentTarget.style.boxShadow = '0 24px 56px rgba(15, 23, 42, 0.13)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.07)';
      }}
      style={{
        height: '100%',
        borderRadius: 22,
        border: `1px solid ${isPending ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
      styles={{ body: { padding: 22 } }}
    >
      <Space align="start" size={14} style={{ width: '100%' }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 17,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: isPending
              ? 'linear-gradient(135deg, #0f62fe, #13c2c2)'
              : token.colorPrimaryBg,
            boxShadow: isPending ? '0 12px 24px rgba(15, 98, 254, 0.2)' : 'none',
            flexShrink: 0,
          }}
        >
          <TeamOutlined style={{ color: isPending ? '#fff' : token.colorPrimary }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Space wrap style={{ marginBottom: 8 }}>
            <Tag color={invitation.memberStatusColor} style={{ margin: 0, borderRadius: 999 }}>
              {invitation.memberStatusLabel}
            </Tag>
            {invitation.isLocked && <Tag color="red" style={{ margin: 0, borderRadius: 999 }}>Đã khóa</Tag>}
          </Space>
          <Title level={4} style={{ margin: 0 }}>
            {invitation.teamName}
          </Title>
          <Text type="secondary">{invitation.hackathonName}</Text>
        </div>
      </Space>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 16,
          background: token.colorFillQuaternary,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Text>Trưởng nhóm: <strong>{invitation.leaderName}</strong></Text>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 10 }} wrap>
          <Text type="secondary">Thành viên</Text>
          <Text strong>{invitation.acceptedMemberCount}/5</Text>
        </Space>
        <Progress percent={progressPercent} showInfo={false} strokeColor={{ from: '#0f62fe', to: '#13c2c2' }} />
        <Text type="secondary">Lời mời đang chờ: {invitation.pendingInviteCount}</Text>
      </div>

      <Space wrap style={{ marginTop: 20 }}>
        {invitation.canAccept && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={loading(INVITATION_ACTION.ACCEPT)}
            onClick={() => confirmAction(INVITATION_ACTION.ACCEPT, 'Tham gia đội này?')}
            style={{ borderRadius: 10, fontWeight: 800 }}
          >
            Chấp nhận
          </Button>
        )}
        {invitation.canReject && (
          <Button
            icon={<CloseOutlined />}
            loading={loading(INVITATION_ACTION.REJECT)}
            onClick={() => confirmAction(INVITATION_ACTION.REJECT, 'Từ chối lời mời?')}
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            Từ chối
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default InvitationCard;
