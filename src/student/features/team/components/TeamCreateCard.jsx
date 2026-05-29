import { Alert, Button, Card, Form, Input, InputNumber, Space, Typography, theme } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const TeamCreateCard = ({ hackathonId, onCreateTeam, loading }) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const handleFinish = async (values) => {
    const success = await onCreateTeam({
      hackathonId: values.hackathonId,
      teamName: values.teamName?.trim(),
    });

    if (success) {
      form.resetFields(['teamName']);
    }
  };

  return (
    <Card
      hoverable
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-3px)';
        event.currentTarget.style.boxShadow = '0 22px 52px rgba(15, 23, 42, 0.11)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.07)';
      }}
      style={{
        borderRadius: 20,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
      styles={{ body: { padding: 24 } }}
    >
      <Space align="start" size={16} style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'linear-gradient(135deg, #0f62fe, #13c2c2)',
            boxShadow: '0 12px 26px rgba(15, 98, 254, 0.24)',
          }}
        >
          <TeamOutlined />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Tạo đội thi
          </Title>
          <Text type="secondary">
            Nhập mã hackathon và tên đội. Track sẽ được Coordinator bốc thăm sau khai mạc.
          </Text>
        </div>
      </Space>

      <Alert
        type="info"
        showIcon
        message="Không chọn Track tại bước này"
        description="Student chỉ tạo đội và mời thành viên. Track, bảng và Mentor thuộc luồng Coordinator."
        style={{ borderRadius: 14, marginBottom: 18 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{ hackathonId }}
        onFinish={handleFinish}
        requiredMark={false}
      >
        <Form.Item
          label="Hackathon ID"
          name="hackathonId"
          rules={[{ required: true, message: 'Vui lòng nhập Hackathon ID.' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="VD: 1" size="large" />
        </Form.Item>

        <Form.Item
          label="Tên đội"
          name="teamName"
          rules={[
            { required: true, message: 'Vui lòng nhập tên đội.' },
            { min: 3, message: 'Tên đội nên có ít nhất 3 ký tự.' },
          ]}
        >
          <Input placeholder="VD: Seal Builders" maxLength={200} showCount size="large" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={loading}
          block
          style={{
            height: 48,
            borderRadius: 14,
            fontWeight: 800,
            boxShadow: '0 12px 24px rgba(22, 119, 255, 0.22)',
          }}
        >
          Tạo đội
        </Button>
      </Form>
    </Card>
  );
};

export default TeamCreateCard;
