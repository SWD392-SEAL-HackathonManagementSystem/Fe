import { Button, Space, Tag, Typography, theme } from 'antd';
import { DeleteOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TeamMemberCard = ({ member, teamId, canCancelInvite, loading, onCancelInvite }) => {
  const { token } = theme.useToken();

  const cardStyle = {
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = '0 14px 28px rgba(15, 23, 42, 0.08)';
        event.currentTarget.style.borderColor = token.colorPrimaryBorder;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = 'none';
        event.currentTarget.style.borderColor = token.colorBorderSecondary;
      }}
    >
      <Space align="start" size={12} style={{ width: '100%' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            color: token.colorPrimary,
            background: token.colorPrimaryBg,
            flexShrink: 0,
          }}
        >
          <UserOutlined />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text strong style={{ display: 'block' }}>
            {member.fullName}
          </Text>
          <Text type="secondary" style={{ display: 'block', wordBreak: 'break-all' }}>
            {member.email}
          </Text>
          <Space wrap size={6} style={{ marginTop: 10 }}>
            <Tag color={member.roleColor} style={{ margin: 0, borderRadius: 999 }}>
              {member.roleLabel}
            </Tag>
            <Tag color={member.statusColor} style={{ margin: 0, borderRadius: 999 }}>
              {member.statusLabel}
            </Tag>
          </Space>
        </div>
      </Space>

      {member.isPending && canCancelInvite && (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          loading={loading}
          onClick={() => onCancelInvite(teamId, member.userId)}
          style={{ marginTop: 10, paddingInline: 0, fontWeight: 700 }}
        >
          Hủy lời mời
        </Button>
      )}
    </div>
  );
};

export default TeamMemberCard;
