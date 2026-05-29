import { useMemo } from 'react';
import { Col, Empty, Row, Skeleton, Typography, theme } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import InvitationCard from '../components/InvitationCard';
import InvitationHero from '../components/InvitationHero';
import { useStudentInvitations } from '../hooks/useStudentInvitations';

const { Text } = Typography;

const StudentInvitationsPage = () => {
  const { token } = theme.useToken();
  const [searchParams] = useSearchParams();
  const initialHackathonId = searchParams.get('hackathonId') || '';
  const {
    hackathonId,
    setHackathonId,
    invitations,
    pendingCount,
    isLoading,
    actionKey,
    fetchInvitations,
    respondInvitation,
  } = useStudentInvitations(initialHackathonId);

  const sortedInvitations = useMemo(
    () => [...invitations].sort((left, right) => Number(right.memberStatus === 'PENDING') - Number(left.memberStatus === 'PENDING')),
    [invitations]
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <InvitationHero
        hackathonId={hackathonId}
        onHackathonChange={setHackathonId}
        pendingCount={pendingCount}
        totalCount={invitations.length}
        loading={isLoading}
        onRefresh={fetchInvitations}
      />

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : invitations.length === 0 ? (
        <Empty
          image={<MailOutlined style={{ fontSize: 54, color: token.colorPrimary }} />}
          description={
            <Text type="secondary">
              Chưa có lời mời nào trong hackathon này.
            </Text>
          }
          style={{
            padding: 56,
            borderRadius: 24,
            background: token.colorBgContainer,
            border: `1px dashed ${token.colorBorder}`,
          }}
        />
      ) : (
        <Row gutter={[20, 20]}>
          {sortedInvitations.map((invitation) => (
            <Col xs={24} md={12} xl={8} key={invitation.key}>
              <InvitationCard
                invitation={invitation}
                actionKey={actionKey}
                onRespond={respondInvitation}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default StudentInvitationsPage;
