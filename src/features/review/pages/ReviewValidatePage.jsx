import React from 'react';
import { Card, Button, Typography, Tag, Alert, Spin, message, theme } from 'antd';
import { CheckCircle, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHackathonValidation } from '../hooks/useHackathonValidation';
import { reviewService } from '../services/reviewService';

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const ValidationItem = ({ status, title, detail, linkText, linkAction }) => {
  // Trích xuất design tokens từ Ant Design để hỗ trợ Dark/Light Mode
  const { token } = useToken();

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={token.colorSuccess} />;
      case 'error':
        return <XCircle size={20} color={token.colorError} />;
      case 'warning':
        return <AlertTriangle size={20} color={token.colorWarning} />;
      default:
        return <CheckCircle size={20} color={token.colorSuccess} />;
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
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        // Nền đổi màu tự động theo status và theme
        background: status === 'error' ? token.colorErrorBg : token.colorBgContainer,
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ marginTop: 2 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 4, color: token.colorText }}>
          {title}
        </div>
        
        {detail && (
          <div
            style={{
              padding: '2px 0',
              fontSize: 13,
              // Chữ đổi màu dựa trên status token
              color: status === 'error' ? token.colorErrorText : status === 'warning' ? token.colorWarningText : token.colorTextSecondary,
            }}
          >
            {status === 'error' || status === 'warning' ? `${status === 'error' ? 'Lỗi' : 'Cảnh báo'}: ` : ''} 
            {detail}
          </div>
        )}

        {/* Nút điều hướng (linkText) nếu có */}
        {linkText && linkAction && (
           <Button type="link" onClick={linkAction} style={{ padding: 0, marginTop: 4 }}>
             {linkText}
           </Button>
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
  const { token } = useToken();

  const {
    hackathon,
    hasCorrectRounds,
    prelimRoundsHaveTracks,
    weightErrors,
    missingCriteriaErrors,
    personnelErrors,
    hasKickoffEvent,
    totalErrors,
    hasBlockingErrors,
    isLoadingData
  } = useHackathonValidation(hId);

  const handleActivate = async () => {
    try {
      await reviewService.changeStatus(hId, 'ONGOING');
      message.success('Kích hoạt giải đấu thành công!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      message.error(error.message || 'Không thể kích hoạt giải đấu');
    }
  };

  if (isLoadingData) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="Đang tải dữ liệu validation..." />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Không tìm thấy giải đấu" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', color: token.colorText }}>
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
            Trạng thái hiện tại: {hackathon.status}
          </Tag>
        </div>
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
          borderColor: (weightErrors.length > 0 || missingCriteriaErrors.length > 0) ? token.colorError : token.colorBorderSecondary,
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
          borderColor: personnelErrors.length > 0 ? token.colorError : token.colorBorderSecondary,
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
                  <Paragraph style={{ margin: 0, color: token.colorErrorText }}>Yêu cầu bổ sung nhân sự:</Paragraph>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0, color: token.colorTextSecondary }}>
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
        style={{ 
          marginBottom: 24, 
          borderRadius: 12, 
          overflow: 'hidden', 
          borderColor: !hasKickoffEvent ? token.colorError : token.colorBorderSecondary 
        }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={hasKickoffEvent ? 'success' : 'error'}
          title="Thiết lập sự kiện Khai mạc (KICKOFF)"
          detail={
            hasKickoffEvent
              ? 'Đã cấu hình sự kiện Khai mạc (KICKOFF) để tiến hành bốc thăm chia bảng.'
              : 'Yêu cầu bắt buộc: Phải có ít nhất 1 sự kiện thuộc loại "KICKOFF" trong Lịch trình sự kiện.'
          }
          linkText={!hasKickoffEvent ? 'Đi tới Lịch trình' : null}
          linkAction={
            !hasKickoffEvent
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
      </Card>

      <Card
        style={{
          marginTop: 32,
          borderRadius: 12,
          borderLeft: `4px solid ${hasBlockingErrors ? token.colorError : token.colorSuccess}`,
          background: token.colorBgContainer,
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
                  <strong style={{ color: token.colorErrorText }}>
                    {totalErrors} lỗi cấu hình
                  </strong>{' '}
                  cần được khắc phục trước khi kích hoạt giải đấu (ONGOING) và mở cổng đăng ký.
                </>
              ) : (
                <>
                  Tất cả các kiểm tra hệ thống bắt buộc đều đã hợp lệ. Giải đấu đã sẵn sàng để kích hoạt và mở cổng đăng ký.
                </>
              )}
            </Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={hasBlockingErrors || hackathon.status !== 'DRAFT'}
            onClick={handleActivate}
            icon={hasBlockingErrors ? <Lock size={16} /> : null}
            danger={hasBlockingErrors} // Ant Design prop cho nút báo lỗi
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