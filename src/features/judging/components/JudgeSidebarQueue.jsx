// src/features/judging/components/JudgeSidebarQueue.jsx
import React from 'react';
import { Card, Typography, List, Tag, Space } from 'antd';
import { PlayCircleOutlined, CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const JudgeSidebarQueue = ({ queue, activeSlot, isFinal, myScores = {} }) => {
  return (
    <Card 
      title={<><ClockCircleOutlined /> Lịch trình ({queue?.length || 0})</>}
      style={{ borderRadius: 24, height: '100%', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}
      styles={{ header: { background: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottom: '1px solid #e2e8f0' }, body: { padding: 0, overflowY: 'auto', flex: 1, background: '#fff' } }}
    >
      <List
        dataSource={queue || []}
        renderItem={(item) => {
          const isPresenting = item.submissionId === activeSlot?.submissionId;
          const isDone = item.status === 'DONE';
          
          // Lấy điểm cá nhân từ Object theo string ID
          const myPersonalScore = myScores[String(item.submissionId)];
          
          return (
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
              background: isPresenting ? '#eff6ff' : isDone ? '#f8fafc' : '#fff',
              borderLeft: isPresenting ? `6px solid #2563eb` : '6px solid transparent',
              transition: 'all 0.3s ease'
            }}>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text strong style={{ fontSize: 16, color: isPresenting ? '#1d4ed8' : (isDone ? '#94a3b8' : '#1e293b'), textDecoration: isDone ? 'line-through' : 'none' }}>
                     {item.order}. {isFinal ? item.teamName : `TEAM-SBM#${item.submissionId}`}
                  </Text>
                </div>
                <div>
                   {myPersonalScore ? (
                     <Tag color="success" style={{ borderRadius: 8, fontWeight: 800, padding: '4px 10px', margin: 0 }}>ĐÃ CHẤM: {myPersonalScore}</Tag>
                   ) : isPresenting ? (
                     <Tag color="blue" icon={<PlayCircleOutlined/>} style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>LIVE</Tag>
                   ) : isDone ? (
                     <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                   ) : (
                     <Text type="secondary" style={{ fontSize: 13 }}><ClockCircleOutlined/> Chờ</Text>
                   )}
                </div>
              </Space>
            </div>
          );
        }}
      />
    </Card>
  );
};

export default JudgeSidebarQueue;