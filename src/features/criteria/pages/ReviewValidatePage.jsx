import React from 'react';
import { Card, Button, Typography, Tag, Alert } from 'antd';
import { CheckCircle, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../../shared/utils/date';
import { useHackathonValidation } from '../hooks/useHackathonValidation';

const { Title, Text, Paragraph } = Typography;

const ValidationItem = ({ status, title, detail, linkText, linkAction }) => {
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
        return <Tag color="error">Lỗi</Tag>;
      case 'warning':
        return <Tag color="warning">Cảnh báo</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
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
        {status === 'error' && detail && (
          <div
            style={{
              background: '#fff1f0',
              border: '1px solid #ffccc7',
              padding: '6px 12px',
              borderRadius: 6,
              marginTop: 4,
              marginBottom: 8,
              fontSize: 13,
              color: '#cf1322',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Lỗi: {detail}
          </div>
        )}
        {status === 'warning' && detail && (
          <div
            style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              padding: '6px 12px',
              borderRadius: 6,
              marginTop: 4,
              marginBottom: 8,
              fontSize: 13,
              color: '#ad6800',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Cảnh báo: {detail}
          </div>
        )}
        {status === 'success' && detail && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {detail}
          </Text>
        )}
        {linkText && linkAction && (
          <div style={{ marginTop: 8 }}>
            <Button type="link" size="small" onClick={linkAction} style={{ paddingLeft: 0 }}>
              {linkText} →
            </Button>
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
  const hId = propHackathonId || parseInt(params.hackathonId);

  // Gọi Custom Hook để lấy logic validation
  const {
    hackathon,
    hasCorrectRounds,
    prelimRoundsHaveTracks,
    weightErrors,
    missingCriteriaErrors,
    personnelErrors,
    hasKickoffEvent,
    hasSchedule,
    totalErrors,
    hasBlockingErrors
  } = useHackathonValidation(hId);

  if (!hackathon) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Không tìm thấy giải đấu" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
            Đánh giá & Kiểm tra cấu hình
          </Title>
          <Tag
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
          >
            ID: HCK-{hackathon.id}
          </Tag>
        </div>
        <Button
          type="text"
          onClick={() => navigate(-1)}
          style={{ fontSize: 16 }}
        >
          ✕
        </Button>
      </div>

      <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
        Trước khi kích hoạt giải đấu, vui lòng kiểm tra lại các yêu cầu cấu hình bắt buộc dưới đây. 
        Tất cả các lỗi phải được khắc phục để có thể mở cổng đăng ký tham gia.
      </Paragraph>

      <Card
        title={<Title level={4} style={{ margin: 0 }}>Cấu trúc Vòng thi & Bảng đấu</Title>}
        style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={hasCorrectRounds && prelimRoundsHaveTracks ? 'success' : 'error'}
          title="Thiết lập Vòng Sơ loại & Chung kết"
          detail={
            hasCorrectRounds && prelimRoundsHaveTracks
              ? 'Giải đấu đã có ít nhất 1 Vòng Sơ loại (kèm bảng đấu) và đúng 1 Vòng Chung kết.'
              : 'Yêu cầu bắt buộc: Phải có ít nhất 1 Vòng Sơ loại (có chứa bảng đấu) và duy nhất 1 Vòng Chung kết (FINAL).'
          }
          linkText={(!hasCorrectRounds || !prelimRoundsHaveTracks) ? 'Đi tới thiết lập Vòng thi' : null}
          linkAction={
            (!hasCorrectRounds || !prelimRoundsHaveTracks)
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Tiêu chí & Chấm điểm</Title>
            {(weightErrors.length > 0 || missingCriteriaErrors.length > 0) && (
              <Tag color="error" icon={<XCircle size={12} />}>
                Cần xử lý
              </Tag>
            )}
          </div>
        }
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          borderColor: (weightErrors.length > 0 || missingCriteriaErrors.length > 0) ? '#ff4d4f' : undefined,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={missingCriteriaErrors.length === 0 ? 'success' : 'error'}
          title="Thiết lập tiêu chí đánh giá"
          detail={
            missingCriteriaErrors.length === 0
              ? 'Tất cả các bảng đấu và vòng chung kết đều đã có tiêu chí.'
              : missingCriteriaErrors.join(' | ')
          }
          linkText={missingCriteriaErrors.length > 0 ? 'Đi tới thiết lập Tiêu chí' : null}
          linkAction={
            missingCriteriaErrors.length > 0
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
        <ValidationItem
          status={weightErrors.length === 0 ? 'success' : 'error'}
          title="Tổng trọng số bằng 1.0"
          detail={
            weightErrors.length === 0
              ? 'Tất cả bộ tiêu chí đều có tổng trọng số chính xác bằng 1.0 (không tính loại PENALTY).'
              : weightErrors.join(' | ') + ' (Bắt buộc phải bằng 1.0)'
          }
          linkText={weightErrors.length > 0 ? 'Cân bằng lại trọng số' : null}
          linkAction={
            weightErrors.length > 0
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Phân công Nhân sự</Title>
            {personnelErrors.length > 0 && (
              <Tag color="error" icon={<XCircle size={12} />}>
                Cần xử lý
              </Tag>
            )}
          </div>
        }
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          borderColor: personnelErrors.length > 0 ? '#ff4d4f' : undefined,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={personnelErrors.length === 0 ? 'success' : 'error'}
          title="Phân công Giám khảo / Mentor"
          detail={
            personnelErrors.length === 0
              ? 'Tất cả các Bảng đấu (Sơ loại) và Vòng chung kết đều đã được phân công đủ Mentor và Giám khảo.'
              : (
                <div>
                  <Paragraph style={{ margin: 0, color: '#ff4d4f' }}>Yêu cầu bổ sung nhân sự:</Paragraph>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {personnelErrors.map((err, i) => <li key={`personnel-${i}`}>{err}</li>)}
                  </ul>
                </div>
              )
          }
          linkText={personnelErrors.length > 0 ? 'Đi tới Quản lý Nhân sự' : null}
          linkAction={
            personnelErrors.length > 0
              ? () => navigate(`/hackathons/${hId}/setup?tab=people`)
              : null
          }
        />
      </Card>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Lịch trình sự kiện</Title>}
        style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', borderColor: !hasKickoffEvent ? '#ff4d4f' : undefined }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={hasKickoffEvent ? 'success' : 'error'}
          title="Thiết lập sự kiện Khai mạc (KICKOFF)"
          detail={
            hasKickoffEvent
              ? 'Đã cấu hình sự kiện Khai mạc (KICKOFF) để tiến hành bốc thăm chia bảng.'
              : 'Yêu cầu bắt buộc: Phải có ít nhất 1 sự kiện thuộc loại "KICKOFF" trong Lịch trình sự kiện (Event Management).'
          }
          linkText={!hasKickoffEvent ? 'Đi tới Lịch trình' : null}
          linkAction={
            !hasKickoffEvent
              ? () => navigate(`/hackathons/${hId}/setup`) // Điều hướng về tab setup chung (có Events)
              : null
          }
        />
      </Card>

      <Card
        style={{
          marginTop: 32,
          borderRadius: 12,
          borderLeft: hasBlockingErrors ? '4px solid #ff4d4f' : '4px solid #52c41a',
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
              Trạng thái sẵn sàng
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16, margin: 0, maxWidth: 600 }}>
              {hasBlockingErrors ? (
                <>
                  Hệ thống phát hiện có{' '}
                  <strong style={{ color: '#ff4d4f' }}>
                    {totalErrors} lỗi cấu hình
                  </strong>{' '}
                  cần được khắc phục trước khi kích hoạt giải đấu (ONGOING) và mở cổng đăng ký.
                </>
              ) : (
                <>
                  Tất cả các kiểm tra hệ thống bắt buộc đều đã hợp lệ. Giải đấu đã sẵn sàng để kích hoạt và mở cổng đăng ký cho sinh viên.
                </>
              )}
            </Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={hasBlockingErrors}
            icon={hasBlockingErrors ? <Lock size={16} /> : null}
            style={{
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {hasBlockingErrors ? 'Chưa thể Kích hoạt' : 'Kích hoạt Giải đấu'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReviewValidatePage;