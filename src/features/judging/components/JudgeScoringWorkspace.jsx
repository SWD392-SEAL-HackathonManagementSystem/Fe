// src/features/judging/components/JudgeScoringWorkspace.jsx
import React from 'react';
import { Card, Typography, Row, Col, Space, Tag, InputNumber, Slider, Input, Button, Result } from 'antd';
import { SaveOutlined, LockOutlined, InfoCircleOutlined, EditOutlined, CheckCircleFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const JudgeScoringWorkspace = ({ logic }) => {
  const { 
    criteria, currentScores, comment, setComment, handleScoreChange, 
    calculateTotal, submitScore, isSubmitting, canScore, 
    localTimerPhase, canSubmitFinalScore, hasScoredCurrentTeam, myScoredSubmissions, activeSlot, isAllDone
  } = logic;

  // HIỂN THỊ MÀN HÌNH CHÚC MỪNG KHI HOÀN THÀNH TẤT CẢ
  if (isAllDone) {
    return (
      <Card style={{ borderRadius: 24, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <Result
          status="success"
          title={<Title level={2} style={{ color: '#10b981', margin: 0 }}>Hoàn Tất Chấm Thi!</Title>}
          subTitle={<Text style={{ fontSize: 16, color: '#64748b' }}>Bạn đã đánh giá xong tất cả các dự án trong phiên này. Cảm ơn sự cống hiến của bạn!</Text>}
        />
      </Card>
    );
  }

  // MÀN HÌNH TRỐNG KHI CHƯA GỌI ĐỘI
  if (!canScore) {
    return (
      <Card style={{ borderRadius: 24, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center' }}>
          <LockOutlined style={{ fontSize: 64, color: '#cbd5e1', marginBottom: 20 }} />
          <Title level={3} style={{ color: '#475569' }}>Sân khấu đang trống</Title>
          <Text style={{ color: '#94a3b8', fontSize: 16 }}>Vui lòng chờ Trưởng ban gọi đội lên sân khấu.</Text>
        </div>
      </Card>
    );
  }

  const isSetup = localTimerPhase === 'SETUP' || localTimerPhase === 'IDLE';
  const finalCalculatedScore = hasScoredCurrentTeam ? myScoredSubmissions[String(activeSlot?.submissionId)] : calculateTotal();

  return (
    <Card 
      style={{ borderRadius: 24, border: 'none', flex: 1, position: 'relative', overflow: 'hidden', background: '#f4f7fe', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
      styles={{ body: { padding: '32px 40px' } }}
    >
      {isSetup && !hasScoredCurrentTeam && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ textAlign: 'center', background: '#fff', padding: '32px 48px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '2px solid #fde68a' }}>
             <LockOutlined style={{ fontSize: 48, color: '#f59e0b', marginBottom: 16 }} />
             <Title level={3} style={{ margin: 0, color: '#b45309' }}>Đội đang Chuẩn bị (Set-up)</Title>
             <Text style={{ color: '#d97706', fontSize: 16, marginTop: 8, display: 'block' }}>Form chấm điểm sẽ mở khóa ngay khi Trưởng ban bấm "Bắt Đầu Tính Giờ".</Text>
           </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, marginBottom: 24, borderBottom: '2px dashed #cbd5e1' }}>
        <div>
          <Text style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1, fontSize: 13, color: '#64748b' }}>
            {hasScoredCurrentTeam ? 'TỔNG ĐIỂM BẠN ĐÃ CHẤM' : 'TỔNG ĐIỂM (PREVIEW)'}
          </Text>
          <div style={{ fontSize: 56, fontWeight: 900, color: hasScoredCurrentTeam ? '#10b981' : '#0f172a', lineHeight: 1, marginTop: 8 }}>
            {finalCalculatedScore} <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 700 }}>/ 10.00</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
           {hasScoredCurrentTeam ? (
             <Tag color="success" style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>Đã hoàn thành đánh giá</Tag>
           ) : (
             <Tag color={canSubmitFinalScore ? 'success' : 'processing'} style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
               {canSubmitFinalScore ? 'Đã cho phép Chốt Điểm' : 'Đang trong thời gian thuyết trình...'}
             </Tag>
           )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {criteria.map((c, index) => (
          <div key={c.id} style={{ padding: 24, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
              <Col span={16}>
                <Space size="small">
                  <Text strong style={{ fontSize: 18, color: '#1e293b' }}>{index + 1}. {c.name}</Text>
                  <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600 }}>Trọng số: {(c.weight * 100).toFixed(0)}%</Tag>
                </Space>
                <Paragraph type="secondary" style={{ margin: '8px 0 0 0', fontSize: 14 }}>{c.description}</Paragraph>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <InputNumber 
                  disabled={hasScoredCurrentTeam} 
                  min={0} max={10} step={0.5} value={currentScores[c.id] || 0} 
                  onChange={(v) => handleScoreChange(c.id, v)} 
                  style={{ width: 90, fontSize: 20, fontWeight: 800, borderRadius: 8 }} size="large"
                />
              </Col>
            </Row>
            <Slider 
              disabled={hasScoredCurrentTeam} 
              min={0} max={10} step={0.5} value={currentScores[c.id] || 0} 
              onChange={(v) => handleScoreChange(c.id, v)} 
              trackStyle={{ background: hasScoredCurrentTeam ? '#94a3b8' : '#2563eb', height: 8 }} 
              handleStyle={{ height: 20, width: 20, marginTop: -6, borderColor: hasScoredCurrentTeam ? '#94a3b8' : '#2563eb' }} 
              railStyle={{ height: 8 }} 
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <Title level={5} style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}><EditOutlined /> Nhận xét chuyên môn</Title>
        <TextArea 
          disabled={hasScoredCurrentTeam} 
          rows={5} placeholder="Ghi chú điểm mạnh, điểm yếu của dự án..." 
          value={comment} onChange={(e) => setComment(e.target.value)} 
          style={{ borderRadius: 12, padding: 16, fontSize: 15, border: '1px solid #cbd5e1', background: hasScoredCurrentTeam ? '#f8fafc' : '#fff' }} 
        />
      </div>

      <div style={{ marginTop: 40 }}>
        {hasScoredCurrentTeam ? (
          <div style={{ padding: 24, background: '#ecfdf5', borderRadius: 16, border: '2px dashed #34d399', textAlign: 'center' }}>
            <CheckCircleFilled style={{ color: '#10b981', fontSize: 36, marginBottom: 12 }} />
            <Title level={4} style={{ color: '#065f46', margin: '0 0 8px 0' }}>Đã Chốt Điểm Thành Công</Title>
            <Text style={{ color: '#047857', fontSize: 15 }}>Dữ liệu điểm đã được lưu vào hệ thống an toàn và không thể chỉnh sửa. Vui lòng chờ Trưởng ban gọi đội tiếp theo.</Text>
          </div>
        ) : (
          <div style={{ padding: 32, background: canSubmitFinalScore ? '#f0fdf4' : '#ffffff', borderRadius: 16, border: `2px solid ${canSubmitFinalScore ? '#86efac' : '#e2e8f0'}`, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            {!canSubmitFinalScore ? (
               <>
                 <InfoCircleOutlined style={{ color: '#3b82f6', fontSize: 32, marginBottom: 12 }} />
                 <Title level={4} style={{ color: '#1e293b', margin: '0 0 8px 0' }}>Chưa thể nộp điểm</Title>
                 <Text type="secondary" style={{ fontSize: 15 }}>Nút chốt điểm sẽ mở khóa ngay khi Trưởng ban chuyển sang phần Q&A hoặc Kết thúc giờ thi.</Text>
               </>
            ) : (
               <Button 
                 type="primary" size="large" icon={<SaveOutlined />} 
                 loading={isSubmitting} onClick={submitScore}
                 style={{ height: 64, width: '100%', fontSize: 20, fontWeight: 900, background: '#10b981', boxShadow: '0 12px 24px rgba(16,185,129,0.3)', borderRadius: 16, border: 'none' }}
               >
                 HOÀN TẤT & CHỐT SỔ ĐIỂM
               </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default JudgeScoringWorkspace;