import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Tag, Space, Alert, Spin, message } from 'antd';
import { CheckCircle, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { hackathonService } from '../../hackathons/services/hackathonService';
import { mapHackathonToFE } from '../../hackathons/mappers/hackathonMapper';

const { Title, Text, Paragraph } = Typography;

// Validation check item component
const ValidationItem = ({ status, title, detail }) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#52c41a" />;
      case 'error':
        return <XCircle size={20} color="#ff4d4f" />;
      case 'warning':
        return <AlertTriangle size={20} color="#faad14" />;
      default:
        return <CheckCircle size={20} color="#52c41a" />;
    }
  };

  const getStatusTag = () => {
    switch (status) {
      case 'success':
        return <Tag color="success">Hợp lệ</Tag>;
      case 'error':
        return <Tag color="error">Lỗi chặn</Tag>;
      case 'warning':
        return <Tag color="warning">Cảnh báo</Tag>;
      default:
        return <Tag>Không rõ</Tag>;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: status === 'error' ? '#fff2f0' : 'white',
      }}
    >
      <div style={{ marginTop: 2 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 4 }}>{title}</div>
        {detail && (
          <div
            style={{
              padding: '2px 0',
              fontSize: 13,
              color: status === 'error' ? '#cf1322' : status === 'warning' ? '#ad6800' : '#595959',
            }}
          >
            {detail}
          </div>
        )}
      </div>
      <div>{getStatusTag()}</div>
    </div>
  );
};

const ReviewValidatePage = ({ hackathonId: propHackathonId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [hackathon, setHackathon] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [activating, setActivating] = useState(false);

  const hId = propHackathonId || parseInt(params.hackathonId);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hackData, readinessData] = await Promise.all([
        hackathonService.getById(hId),
        hackathonService.getReadiness(hId)
      ]);
      setHackathon(mapHackathonToFE(hackData));
      setReadiness(readinessData);
    } catch (error) {
      message.error(error.message || 'Lỗi khi tải dữ liệu cấu hình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hId]);

  const handleActivate = async () => {
    try {
      setActivating(true);
      await hackathonService.updateStatus(hId, 'ONGOING');
      message.success('Kích hoạt sự kiện Hackathon thành công! Trạng thái hiện tại: ONGOING.');
      await loadData();
    } catch (error) {
      message.error(error.message || 'Lỗi khi kích hoạt Hackathon');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 12 }}>
        <Spin size="large" />
      </Card>
    );
  }

  if (!hackathon) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Không tìm thấy sự kiện Hackathon" />
      </div>
    );
  }

  const { ready, blockers = [], warnings = [], summary = {} } = readiness || {};

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            Kiểm tra & Cấu hình Sự kiện
          </Title>
          <Tag
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
          >
            Trạng thái hiện tại: {hackathon.status}
          </Tag>
        </div>
      </div>

      {/* Description */}
      <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
        Trước khi kích hoạt sự kiện Hackathon (chuyển sang ONGOING), hệ thống sẽ chạy dry-run kiểm tra các điều kiện sẵn sàng.
        Tất cả các lỗi chặn (Blockers) phải được giải quyết. Các cảnh báo (Warnings) được khuyến nghị xử lý nhưng không chặn việc kích hoạt.
      </Paragraph>

      {/* Section 1: Summary Statistics */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Thống kê cấu hình</Title>}
        style={{ marginBottom: 24, borderRadius: 12 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <Text type="secondary">Bảng đấu (Tracks)</Text>
            <Title level={3} style={{ margin: '4px 0 0 0' }}>{summary.tracksCount || 0}</Title>
          </div>
          <div>
            <Text type="secondary">Vòng thi (Rounds)</Text>
            <Title level={3} style={{ margin: '4px 0 0 0' }}>{summary.roundsCount || 0}</Title>
          </div>
          <div>
            <Text type="secondary">Tiêu chí (Criteria)</Text>
            <Title level={3} style={{ margin: '4px 0 0 0' }}>{summary.criteriaCount || 0}</Title>
          </div>
          <div>
            <Text type="secondary">Lịch trình (Events)</Text>
            <Title level={3} style={{ margin: '4px 0 0 0' }}>{summary.eventsCount || 0}</Title>
          </div>
        </div>
      </Card>

      {/* Section 2: Validation Results */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Kết quả kiểm tra sẵn sàng</Title>
            {blockers.length > 0 && (
              <Tag color="error" icon={<XCircle size={12} style={{ marginRight: 4 }} />}>
                Yêu cầu xử lý
              </Tag>
            )}
          </div>
        }
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          borderColor: blockers.length > 0 ? '#ff4d4f' : undefined,
        }}
        styles={{ body: { padding: 0 } }}
      >
        {blockers.length === 0 && warnings.length === 0 && (
          <div style={{ padding: '24px 32px', textAlign: 'center' }}>
            <CheckCircle size={40} color="#52c41a" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#52c41a' }}>Tất cả các điều kiện sẵn sàng đều hợp lệ!</div>
          </div>
        )}

        {blockers.map((b, idx) => (
          <ValidationItem
            key={`blocker-${idx}`}
            status="error"
            title="Lỗi chặn cấu hình"
            detail={b.message}
          />
        ))}

        {warnings.map((w, idx) => (
          <ValidationItem
            key={`warning-${idx}`}
            status="warning"
            title="Cảnh báo cấu hình"
            detail={w.message}
          />
        ))}
      </Card>

      {/* Activation Area */}
      <Card
        style={{
          marginTop: 32,
          borderRadius: 12,
          borderLeft: blockers.length > 0 ? '4px solid #ff4d4f' : '4px solid #52c41a',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 300 }}>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              Kích hoạt sự kiện Hackathon
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16, margin: 0, maxWidth: 600 }}>
              {blockers.length > 0 ? (
                <>
                  Cấu hình sự kiện của bạn có{' '}
                  <strong style={{ color: '#ff4d4f' }}>
                    {blockers.length} lỗi chặn
                  </strong>{' '}
                  cần được khắc phục trước khi bạn có thể kích hoạt sự kiện để mở cổng đăng ký.
                </>
              ) : (
                <>
                  Tất cả các điều kiện bắt buộc đã sẵn sàng. Bạn có thể kích hoạt sự kiện ngay bây giờ.
                </>
              )}
            </Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={blockers.length > 0 || hackathon.status !== 'DRAFT'}
            loading={activating}
            icon={blockers.length > 0 ? <Lock size={16} /> : null}
            onClick={handleActivate}
            style={{
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {hackathon.status === 'ONGOING' ? '🚀 Sự kiện đã kích hoạt' : blockers.length > 0 ? 'Chưa đủ điều kiện kích hoạt' : '🚀 Kích hoạt Hackathon'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReviewValidatePage;
