import { Alert, Button, InputNumber, Space, Statistic, Typography } from 'antd';
import { MailCheck, RefreshCw } from 'lucide-react';

const { Text, Title } = Typography;

const InvitationHero = ({ hackathonId, onHackathonChange, pendingCount, totalCount, loading, onRefresh }) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 28,
      padding: '30px clamp(22px, 4vw, 36px)',
      marginBottom: 24,
      color: '#fff',
      background: 'linear-gradient(135deg, #12263f 0%, #0f62fe 50%, #13c2c2 100%)',
      boxShadow: '0 24px 58px rgba(15, 98, 254, 0.22)',
    }}
  >
    <div style={{ position: 'absolute', right: -80, top: -90, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
    <div style={{ position: 'absolute', left: -120, bottom: -150, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

    <Space size={18} align="start" style={{ position: 'relative', width: '100%', justifyContent: 'space-between' }} wrap>
      <div style={{ maxWidth: 720 }}>
        <Text style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
          Team Invitations
        </Text>
        <Title level={2} style={{ margin: '8px 0', color: '#fff' }}>
          Lời mời đội
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.86)', display: 'block' }}>
          Xem lời mời, chấp nhận tham gia đội hoặc rời đội khi còn trong giai đoạn đăng ký.
        </Text>
      </div>

      <Space size={12}>
        <Statistic value={pendingCount} title={<span style={{ color: 'rgba(255,255,255,0.72)' }}>Đang chờ</span>} valueStyle={{ color: '#fff', fontWeight: 800 }} />
        <Statistic value={totalCount} title={<span style={{ color: 'rgba(255,255,255,0.72)' }}>Tổng mục</span>} valueStyle={{ color: '#fff', fontWeight: 800 }} />
      </Space>
    </Space>

    <Alert
      showIcon
      type="info"
      message="Nhập Hackathon ID rồi bấm Tải lại"
      description="Trang chỉ tải lời mời khi bạn chủ động bấm nút, tránh gọi API khi đang nhập mã sự kiện."
      style={{ maxWidth: 720, borderRadius: 14, marginTop: 20, border: 0 }}
    />

    <Space.Compact style={{ width: 'min(540px, 100%)', marginTop: 18 }}>
      <InputNumber
        min={1}
        value={hackathonId ? Number(hackathonId) : null}
        placeholder="Hackathon ID"
        onChange={onHackathonChange}
        style={{ width: '100%' }}
        size="large"
      />
      <Button type="primary" icon={<RefreshCw size={16} />} loading={loading} onClick={onRefresh} size="large">
        Tải lại
      </Button>
    </Space.Compact>

    <MailCheck size={88} style={{ position: 'absolute', right: 34, bottom: 20, opacity: 0.16 }} />
  </div>
);

export default InvitationHero;
