import { Button, Card, Form, Input, Modal, Select, Space, Tag, Typography, theme } from 'antd';
import { DeleteOutlined, MailOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const TeamMemberManager = ({ team, onInviteMember, onCancelInvite, onTransferLeader, loading }) => {
  const [inviteForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const { token } = theme.useToken();

  if (!team) return null;

  const handleInvite = async (values) => {
    const success = await onInviteMember(team.id, values.email?.trim());
    if (success) inviteForm.resetFields();
  };

  const handleTransfer = (values) => {
    const nextLeader = team.transferCandidates.find((member) => member.userId === values.newLeaderId);
    Modal.confirm({
      title: 'Chuyển quyền trưởng nhóm?',
      content: `Người nhận quyền: ${nextLeader?.fullName || 'thành viên đã chọn'}. Sau khi chuyển, bạn sẽ không còn là trưởng nhóm.`,
      okText: 'Chuyển quyền',
      cancelText: 'Hủy',
      onOk: async () => {
        await onTransferLeader(team.id, values.newLeaderId);
        transferForm.resetFields();
      },
    });
  };

  const memberCardStyle = {
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
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
              placeholder={team.canInvite ? 'email@student.com' : 'Đội đã đầy hoặc đã khóa'}
              disabled={!team.canInvite || !team.isCurrentUserLeader}
              style={{ height: 44 }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!team.canInvite || !team.isCurrentUserLeader}
            style={{ height: 44, fontWeight: 800 }}
          >
            Mời
          </Button>
        </Space.Compact>
      </Form>

      {!team.isCurrentUserLeader && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Chỉ trưởng nhóm mới có thể mời thành viên hoặc chuyển quyền.
        </Text>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        {team.members.map((member) => (
          <div
            key={`${team.id}-${member.userId}`}
            style={memberCardStyle}
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

            {member.isPending && team.isCurrentUserLeader && (
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                loading={loading}
                onClick={() => onCancelInvite(team.id, member.userId)}
                style={{ marginTop: 10, paddingInline: 0, fontWeight: 700 }}
              >
                Hủy lời mời
              </Button>
            )}
          </div>
        ))}
      </div>

      {team.canTransferLeader && team.transferCandidates.length > 0 && (
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleTransfer}
          requiredMark={false}
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            background: token.colorFillQuaternary,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Form.Item
            label="Chuyển quyền trưởng nhóm"
            name="newLeaderId"
            rules={[{ required: true, message: 'Chọn thành viên nhận quyền.' }]}
          >
            <Select
              placeholder="Chọn thành viên đã tham gia"
              options={team.transferCandidates.map((member) => ({
                value: member.userId,
                label: `${member.fullName} - ${member.email}`,
              }))}
            />
          </Form.Item>
          <Button icon={<SwapOutlined />} htmlType="submit" loading={loading} style={{ borderRadius: 10, fontWeight: 700 }}>
            Chuyển leader
          </Button>
        </Form>
      )}
    </Card>
  );
};

export default TeamMemberManager;
