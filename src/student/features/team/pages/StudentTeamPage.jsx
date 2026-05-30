import { Alert, Card, Col, Empty, Input, Row, Select, Skeleton, Space, Typography, theme } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import TeamCreateCard from '../components/TeamCreateCard';
import TeamDangerZone from '../components/TeamDangerZone';
import TeamMemberManager from '../components/TeamMemberManager';
import TeamOverviewCard from '../components/TeamOverviewCard';
import { useStudentTeam } from '../hooks/useStudentTeam';

const { Text, Title } = Typography;

const StudentTeamPage = () => {
  const { token } = theme.useToken();
  const [searchParams] = useSearchParams();
  const initialHackathonId = searchParams.get('hackathonId') || '';
  const {
    hackathonId,
    setHackathonId,
    teams,
    selectedTeam,
    selectedTeamId,
    setSelectedTeamId,
    isLoading,
    isActionLoading,
    createTeam,
    inviteMember,
    cancelPendingInvite,
    leaveTeam,
    transferLeader,
    disbandTeam,
  } = useStudentTeam(initialHackathonId);

  const hasTeams = teams.length > 0;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          padding: '30px clamp(22px, 4vw, 36px)',
          marginBottom: 24,
          color: '#fff',
          background: 'linear-gradient(135deg, #102a43 0%, #0f62fe 48%, #13c2c2 100%)',
          boxShadow: '0 24px 58px rgba(15, 98, 254, 0.22)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.12), transparent 42%)' }} />
        <div style={{ position: 'absolute', right: -90, bottom: -130, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }} />
        <div style={{ position: 'relative', maxWidth: 760 }}>
          <Text style={{ color: 'rgba(255,255,255,0.76)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
            Student Workspace
          </Text>
          <Title level={2} style={{ margin: '8px 0', color: '#fff' }}>
            Đội thi của tôi
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.86)', display: 'block' }}>
            Tạo đội, mời thành viên, chuyển leader và theo dõi trạng thái duyệt đội trong giai đoạn đăng ký.
          </Text>
          <Alert
            showIcon
            type="info"
            message="Student không chọn Track khi tạo đội"
            description="Track chỉ được gán ở bước bốc thăm do Coordinator thực hiện."
            style={{ maxWidth: 620, borderRadius: 14, marginTop: 20, border: 0 }}
          />
        </div>
      </div>

      <Row gutter={[24, 24]} align="start">
        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 16 }}>
            <Card 
              style={{ marginBottom: 24, borderRadius: 20, border: `1px solid ${token.colorBorderSecondary}`, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.05)' }} 
              styles={{ body: { padding: 24 } }}
            >
              <Title level={5} style={{ marginTop: 0 }}>Xem đội đã tham gia</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Nhập Hackathon ID để tải thông tin đội thi của bạn.
              </Text>
              <Input.Search
                placeholder="Nhập Hackathon ID..."
                allowClear
                enterButton="Tải đội"
                size="large"
                type="number"
                onSearch={(value) => {
                  if (value) setHackathonId(value);
                }}
              />
            </Card>

            <TeamCreateCard
              hackathonId={hackathonId}
              onCreateTeam={createTeam}
              loading={isActionLoading}
            />
          </div>
        </Col>

        <Col xs={24} lg={16}>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : !hasTeams ? (
            <Empty
              image={<TeamOutlined style={{ fontSize: 54, color: token.colorPrimary }} />}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>Chưa có đội trong hackathon này</Text>
                  <Text type="secondary">Nhập Hackathon ID và tên đội để bắt đầu lập đội thi.</Text>
                </Space>
              }
              style={{
                padding: 56,
                borderRadius: 24,
                background: token.colorBgContainer,
                border: `1px dashed ${token.colorBorder}`,
              }}
            />
          ) : (
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {teams.length > 1 && (
                <Select
                  value={selectedTeamId}
                  size="large"
                  style={{ width: '100%' }}
                  onChange={setSelectedTeamId}
                  options={teams.map((team) => ({
                    value: team.id,
                    label: `${team.teamName} - ${team.statusLabel}`,
                  }))}
                />
              )}

              <TeamOverviewCard team={selectedTeam} />

              <TeamMemberManager
                team={selectedTeam}
                loading={isActionLoading}
                onInviteMember={inviteMember}
                onCancelInvite={cancelPendingInvite}
                onLeaveTeam={leaveTeam}
                onTransferLeader={transferLeader}
              />

              <TeamDangerZone
                team={selectedTeam}
                loading={isActionLoading}
                onDisbandTeam={disbandTeam}
              />
            </Space>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentTeamPage;
