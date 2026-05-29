import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Modal, Form, Input, Select, Space, Card,
  Typography, Tooltip, Empty, message, Alert
} from 'antd';
import {
  UserAddOutlined, MailOutlined, BankOutlined, CalendarOutlined,
  SendOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { userService } from '../services/userService';
import { useAppContext } from '../../../app/AppContext';

const { Title, Text } = Typography;
const { Option } = Select;

const TempJudgesPage = () => {
  const { hackathons } = useAppContext();
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTempJudges = async () => {
    setLoading(true);
    try {
      const data = await userService.getTempJudges();
      setJudges(Array.isArray(data) ? data : data?.content || data?.tempJudges || []);
    } catch (error) {
      console.error('Fetch temp judges error:', error);
      message.error('Không thể lấy danh sách giám khảo khách mời.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTempJudges();
  }, []);

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      await userService.createTempJudge(values);
      message.success('Đã mời giám khảo khách mời thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchTempJudges();
    } catch (error) {
      console.error('Create temp judge error:', error);
      const code = error?.code || error?.data?.error?.code;
      if (code === 'DUPLICATE_PENDING_INVITATION') {
        message.error('Đã tồn tại lời mời đang chờ xử lý cho email này.');
      } else if (code === 'INVITATION_HACKATHON_REQUIRED') {
        message.error('Thông tin sự kiện Hackathon là bắt buộc.');
      } else {
        message.error(error?.message || 'Có lỗi xảy ra khi gửi lời mời.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (record) => {
    const invitationId = record.invitationId || record.id;
    if (!invitationId) {
      message.error('Không tìm thấy ID lời mời.');
      return;
    }

    try {
      await userService.resendInvitation(invitationId);
      message.success('Đã gửi lại lời mời thành công!');
      fetchTempJudges();
    } catch (error) {
      console.error('Resend invitation error:', error);
      const code = error?.code || error?.data?.error?.code;
      if (code === 'INVITATION_RESEND_AFTER_KICKOFF_CUTOFF') {
        message.error('Không thể gửi lại lời mời do đã vượt quá giới hạn 48 giờ trước giờ Khai mạc.');
      } else {
        message.error(error?.message || 'Không thể gửi lại lời mời.');
      }
    }
  };

  // Kiểm tra điều kiện resend có bị cấm hay không (< 48h trước kickoff)
  const isResendDisabled = (record) => {
    const hackathon = hackathons.find(h => h.id === record.hackathonId);
    if (!hackathon || !hackathon.kickoff) return false;
    
    // Nếu thời điểm hiện tại tới giờ kickoff còn ít hơn 48 tiếng, disable resend
    const kickoffTime = dayjs(hackathon.kickoff);
    const diffHours = kickoffTime.diff(dayjs(), 'hour');
    return diffHours < 48;
  };

  const getInvitationStatusTag = (record) => {
    // Trạng thái đã đổi mật khẩu (đã kích hoạt tài khoản)
    if (record.passwordChanged || record.status === 'ACCEPTED') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Đã đổi MK / Hoạt động</Tag>;
    }
    // Trạng thái lời mời đã hết hạn
    if (record.isExpired || record.status === 'EXPIRED') {
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Đã hết hạn</Tag>;
    }
    // Đang chờ chấp nhận
    return <Tag color="processing" icon={<ClockCircleOutlined />}>Đang chờ (Còn hạn)</Tag>;
  };

  const columns = [
    {
      title: 'Giám khảo',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong style={{ color: '#111827' }}>{text}</strong>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            ID: {record.userId || record.id}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <span style={{ fontFamily: 'monospace' }}>{email}</span>
      ),
    },
    {
      title: 'Đơn vị / Tổ chức',
      dataIndex: 'institution',
      key: 'institution',
      render: (text) => text || <Text type="secondary">—</Text>,
    },
    {
      title: 'Sự kiện Hackathon',
      dataIndex: 'hackathonId',
      key: 'hackathonId',
      render: (hid) => {
        const hackathon = hackathons.find(h => h.id === hid);
        return (
          <div>
            <strong>{hackathon?.name || hackathon?.hackathonName || `Sự kiện #${hid}`}</strong>
            {hackathon?.kickoff && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: 2 }}>
                Khai mạc: {dayjs(hackathon.kickoff).format('DD/MM/YYYY HH:mm')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái lời mời',
      key: 'invitationStatus',
      render: (_, record) => getInvitationStatusTag(record),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => {
        const isAccepted = record.passwordChanged || record.status === 'ACCEPTED';
        if (isAccepted) {
          return <Text type="secondary">Đã kích hoạt</Text>;
        }

        const disabled = isResendDisabled(record);
        const btn = (
          <Button
            type="default"
            icon={<SendOutlined />}
            onClick={() => handleResend(record)}
            disabled={disabled}
            style={{ borderRadius: '10px' }}
          >
            Gửi lại thư mời
          </Button>
        );

        if (disabled) {
          return (
            <Tooltip title="Không thể gửi lại thư mời trong vòng 48h trước giờ Khai mạc của Hackathon.">
              {btn}
            </Tooltip>
          );
        }

        return btn;
      },
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <Card
        style={{
          borderRadius: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0, background: 'linear-gradient(90deg, #ff4d4f, #ff7875)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Quản lý Giám khảo khách mời
            </Title>
            <Text type="secondary">Tạo lời mời cho các chuyên gia chấm thi ngoài hệ thống và quản lý hạn của thư mời.</Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={{ borderRadius: '12px', backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              Mời Giám khảo mới
            </Button>
            <Button
              type="default"
              onClick={fetchTempJudges}
              style={{ borderRadius: '12px' }}
            >
              Tải lại
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={judges}
          rowKey={(record) => record.id || record.email}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="Chưa có giám khảo khách mời nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }}
          style={{ overflowX: 'auto' }}
        />
      </Card>

      {/* Invite Modal */}
      <Modal
        title="Mời giám khảo khách tham gia Hackathon"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Gửi lời mời"
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', borderRadius: '10px' } }}
        cancelButtonProps={{ style: { borderRadius: '10px' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Họ và tên Giám khảo"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input prefix={<UserAddOutlined style={{ color: '#ff4d4f' }} />} placeholder="VD: TS. Nguyễn Văn A" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#ff4d4f' }} />} placeholder="VD: judge@example.com" style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item
            name="institution"
            label="Đơn vị / Tổ chức (Tùy chọn)"
          >
            <Input prefix={<BankOutlined style={{ color: '#ff4d4f' }} />} placeholder="VD: Đại học Bách Khoa, TechCorp..." style={{ borderRadius: '10px' }} />
          </Form.Item>

          <Form.Item
            name="hackathonId"
            label="Sự kiện Hackathon tham gia chấm"
            rules={[{ required: true, message: 'Vui lòng chọn sự kiện Hackathon!' }]}
          >
            <Select placeholder="Chọn một sự kiện Hackathon" dropdownStyle={{ borderRadius: '12px' }} style={{ height: '40px' }}>
              {hackathons.map((h) => (
                <Option key={h.id} value={h.id}>
                  {h.name || h.hackathonName || `Sự kiện #${h.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Alert
            message="Lưu ý"
            description="Giám khảo khách sẽ nhận được email hướng dẫn đăng nhập cùng với mật khẩu tạm thời. Lời mời có hiệu lực đến trước giờ Khai mạc 48 tiếng."
            type="info"
            showIcon
            style={{ borderRadius: '10px' }}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default TempJudgesPage;
