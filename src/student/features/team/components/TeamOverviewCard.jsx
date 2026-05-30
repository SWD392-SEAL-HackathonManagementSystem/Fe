import { Card, Col, Progress, Row, Space, Tag, Typography, theme } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { TEAM_MEMBER_LIMITS } from '../constants/studentTeam.constants';

const { Text, Title } = Typography;

const statBox = (token) => ({
  padding: 14,
  borderRadius: 16,
  background: token.colorFillQuaternary,
  border: `1px solid ${token.colorBorderSecondary}`,
  minHeight: 82,
});

const TeamOverviewCard = ({ team }) => {
  const { token } = theme.useToken();

  if (!team) return null;

  const progressPercent = Math.min(
    100,
    Math.round((team.acceptedMemberCount / TEAM_MEMBER_LIMITS.MAX_ACCEPTED) * 100)
  );

  return (
    <Card
      hoverable
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-3px)';
        event.currentTarget.style.boxShadow = '0 22px 52px rgba(15, 23, 42, 0.12)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = '0 18px 46px rgba(15, 23, 42, 0.08)';
      }}
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 24,
          color: '#fff',
          background: 'linear-gradient(135deg, #0f62fe 0%, #0786d8 48%, #13c2c2 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -42,
            top: -58,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.14)',
          }}
        />
        <Space wrap style={{ marginBottom: 12, position: 'relative' }}>
          <Tag color={team.statusColor} style={{ borderRadius: 999, margin: 0 }}>
            {team.statusLabel}
          </Tag>
          <Tag
            color={team.isLocked ? 'red' : 'green'}
            icon={team.isLocked ? <LockOutlined /> : <UnlockOutlined />}
            style={{ borderRadius: 999, margin: 0 }}
          >
            {team.isLocked ? 'Đã khóa' : 'Đang mở'}
          </Tag>
        </Space>
        <Title level={2} style={{ margin: 0, color: '#fff', position: 'relative' }}>
          {team.teamName}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.84)', position: 'relative' }}>
          {team.hackathonName}
        </Text>
      </div>

      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={statBox(token)}>
              <Text type="secondary">Trưởng nhóm</Text>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{team.leaderName}</div>
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={statBox(token)}>
              <Text type="secondary">Đã tham gia</Text>
              <div style={{ fontWeight: 800, fontSize: 20, marginTop: 6 }}>{team.memberCapacityLabel}</div>
            </div>
          </Col>
          <Col xs={12} md={8}>
            <div style={statBox(token)}>
              <Text type="secondary">Lời mời chờ</Text>
              <div style={{ fontWeight: 800, fontSize: 20, marginTop: 6 }}>{team.pendingInviteCount}</div>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 20 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Text strong>Điều kiện duyệt đội</Text>
            <Text type={team.isMemberCountReady ? 'success' : 'secondary'}>
              Cần {TEAM_MEMBER_LIMITS.MIN_ACCEPTED}-{TEAM_MEMBER_LIMITS.MAX_ACCEPTED} thành viên đã tham gia
            </Text>
          </Space>
          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor={{ from: '#0f62fe', to: '#13c2c2' }}
            trailColor={token.colorFillSecondary}
          />
        </div>

        {team.rejectionReason && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              color: token.colorError,
              background: token.colorErrorBg,
              border: `1px solid ${token.colorErrorBorder}`,
            }}
          >
            Lý do từ chối: {team.rejectionReason}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TeamOverviewCard;
