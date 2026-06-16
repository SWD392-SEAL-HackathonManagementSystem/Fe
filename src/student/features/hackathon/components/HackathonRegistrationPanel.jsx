import { Badge, Button, Card, Empty, Space, Spin, Tag, Typography, message, theme } from 'antd';
import { useStudentHackathonRegistration } from '../hooks/useStudentHackathonRegistration';
import { getStudentHackathonErrorMessage } from '../constants/studentHackathon.constants';

const { Text, Title } = Typography;

const HackathonRegistrationPanel = ({ hasTeam = false }) => {
  const { token } = theme.useToken();
  const {
    hackathons,
    loading,
    actionLoading,
    registrationBlocked,
    register,
    unregister,
  } = useStudentHackathonRegistration();

  const handleRegister = async (hackathonId) => {
    const result = await register(hackathonId);
    if (result.success) {
      message.success('Đăng ký tham gia hackathon thành công');
      return;
    }
    message.error(getStudentHackathonErrorMessage(result.error));
  };

  const handleUnregister = async (hackathonId) => {
    const result = await unregister(hackathonId);
    if (result.success) {
      message.success('Đã hủy đăng ký hackathon');
      return;
    }
    message.error(getStudentHackathonErrorMessage(result.error, 'Không thể hủy đăng ký'));
  };

  if (loading) {
    return (
      <Card style={{ borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!hackathons.length) {
    return null;
  }

  return (
    <Card
      title="Đăng ký Hackathon"
      style={{
        borderRadius: 16,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary,
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {hackathons.map((item) => {
          const isRegistered = Boolean(item.registered);
          const isBlocked = registrationBlocked[item.id];

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title level={5} style={{ margin: 0 }}>
                  {item.name}
                </Title>
                <Space size={8} wrap style={{ marginTop: 6 }}>
                  <Tag color="processing">{item.status}</Tag>
                  {isRegistered ? (
                    <Badge status="success" text="Đã đăng ký" />
                  ) : (
                    <Badge status="default" text="Chưa đăng ký" />
                  )}
                </Space>
                {isBlocked && (
                  <Text type="danger" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
                    Đăng ký thất bại: Giải đấu đã đạt giới hạn tối đa số lượng người tham gia.
                  </Text>
                )}
              </div>

              <Space>
                {!isRegistered && (
                  <Button
                    type="primary"
                    disabled={isBlocked}
                    loading={actionLoading}
                    onClick={() => handleRegister(item.id)}
                  >
                    Đăng ký tham gia
                  </Button>
                )}
                {isRegistered && !hasTeam && (
                  <Button
                    danger
                    loading={actionLoading}
                    onClick={() => handleUnregister(item.id)}
                  >
                    Hủy đăng ký
                  </Button>
                )}
              </Space>
            </div>
          );
        })}
      </Space>

      {!hackathons.length && <Empty description="Không có hackathon đang mở đăng ký" />}
    </Card>
  );
};

export default HackathonRegistrationPanel;
