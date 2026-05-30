import { useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Input, Space, Typography, theme } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { MEMBER_STATUS } from '../constants/studentTeam.constants';
import LeaveTeamPanel from './LeaveTeamPanel';
import MemberStatusFilter, { MEMBER_FILTERS } from './MemberStatusFilter';
import TeamMemberCard from './TeamMemberCard';
import TransferLeaderForm from './TransferLeaderForm';

const { Text, Title } = Typography;

const TeamMemberManager = ({ team, onInviteMember, onCancelInvite, onLeaveTeam, onTransferLeader, loading }) => {
  const [inviteForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [memberFilter, setMemberFilter] = useState(MEMBER_STATUS.ACCEPTED);
  const { token } = theme.useToken();
  const members = useMemo(() => team?.members || [], [team?.members]);

  const memberCounts = useMemo(
    () =>
      members.reduce(
        (result, member) => ({
          ...result,
          [member.status]: (result[member.status] || 0) + 1,
        }),
        { ALL: members.length }
      ),
    [members]
  );

  const filteredMembers = useMemo(
    () =>
      memberFilter === 'ALL'
        ? members
        : members.filter((member) => member.status === memberFilter),
    [memberFilter, members]
  );

  const selectedFilterLabel =
    MEMBER_FILTERS.find((filter) => filter.value === memberFilter)?.label.toLowerCase() || 'phù hợp';

  if (!team) return null;

  const inviteDisabledReason = (() => {
    if (team.canInvite) return '';
    if (!team.isCurrentUserLeader) return 'Chỉ trưởng nhóm mới có thể mời thành viên.';
    if (team.isLocked) return 'Đội đã khóa, không thể thay đổi thành viên.';
    if (team.isFull) return 'Đội đã đủ 5 thành viên.';
    return 'Trạng thái đội hiện tại chưa cho phép mời thêm thành viên.';
  })();

  const handleInvite = async (values) => {
    const success = await onInviteMember(team.id, values.email?.trim());
    if (success) inviteForm.resetFields();
  };

  return (
    <Card
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            Thành viên đội
          </Title>
          <Text type="secondary">Quản lý lời mời, trạng thái tham gia và quyền trưởng nhóm.</Text>
        </Space>
      }
      style={{
        borderRadius: 18,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
      }}
      styles={{ body: { padding: 22 } }}
    >
      <Form form={inviteForm} layout="vertical" onFinish={handleInvite} requiredMark={false}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="email"
            noStyle
            rules={[
              { required: true, message: 'Vui lòng nhập email thành viên.' },
              { type: 'email', message: 'Email không hợp lệ.' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={team.canInvite ? 'email@student.com' : inviteDisabledReason}
              disabled={!team.canInvite}
              style={{ height: 44 }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!team.canInvite}
            style={{ height: 44, fontWeight: 800 }}
          >
            Mời
          </Button>
        </Space.Compact>
      </Form>

      {inviteDisabledReason && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {inviteDisabledReason}
        </Text>
      )}

      <MemberStatusFilter counts={memberCounts} value={memberFilter} onChange={setMemberFilter} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        {filteredMembers.map((member) => (
          <TeamMemberCard
            key={`${team.id}-${member.userId}`}
            member={member}
            teamId={team.id}
            canCancelInvite={team.isCurrentUserLeader}
            loading={loading}
            onCancelInvite={onCancelInvite}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`Không có thành viên nào ở trạng thái ${selectedFilterLabel}.`}
          style={{
            marginTop: 12,
            padding: 24,
            borderRadius: 16,
            background: token.colorFillQuaternary,
          }}
        />
      )}

      <TransferLeaderForm team={team} form={transferForm} loading={loading} onTransferLeader={onTransferLeader} />

      {team.canLeaveTeam && (
        <LeaveTeamPanel teamId={team.id} loading={loading} onLeaveTeam={onLeaveTeam} />
      )}
    </Card>
  );
};

export default TeamMemberManager;
