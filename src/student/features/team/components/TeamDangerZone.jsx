import { Button, Card, Modal, Space, Typography, theme } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const TeamDangerZone = ({ team, onDisbandTeam, loading }) => {
  const { token } = theme.useToken();

  if (!team) return null;

  const disabled = !team.canDisband || team.status === 'ELIMINATED';

  const handleDisband = () => {
    Modal.confirm({
      title: 'Giải tán đội?',
      icon: <ExclamationCircleOutlined />,
      content: 'Thao tác này sẽ đưa đội về trạng thái không còn tham gia. Chỉ thực hiện khi đội chưa có Mentor.',
      okText: 'Giải tán đội',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => onDisbandTeam(team.id),
    });
  };

  return (
    <Card
      style={{
        borderRadius: 18,
        borderColor: token.colorErrorBorder,
        background: `linear-gradient(135deg, ${token.colorErrorBg}, ${token.colorBgContainer})`,
        boxShadow: '0 12px 30px rgba(255, 77, 79, 0.08)',
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div style={{ maxWidth: 620 }}>
          <Title level={5} style={{ margin: 0 }}>
            Khu vực cần thận trọng
          </Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
            Trưởng nhóm chỉ có thể giải tán đội trước khi đội có Mentor. Đội đã bị loại thì không cần giải tán.
          </Text>
        </div>
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={disabled}
          loading={loading}
          onClick={handleDisband}
          style={{ borderRadius: 10, fontWeight: 700 }}
        >
          Giải tán đội
        </Button>
      </Space>
    </Card>
  );
};

export default TeamDangerZone;
