import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Typography, Select, Spin, Space } from 'antd';
import { TeamOutlined, SearchOutlined } from '@ant-design/icons';
import { useHackathonSelect } from '../hooks/useHackathonSelect';

import ApprovalTable from '../components/ApprovalTab/ApprovalTable';
import { TAB_KEYS } from '../constants/team.constants';

const { Title, Text } = Typography;

const CoordinatorTeamPage = () => {
  const { hackathonId } = useParams();
  
  const { 
    hackathons, 
    selectedHackathonId, 
    setSelectedHackathonId, 
    isLoadingHackathons 
  } = useHackathonSelect(hackathonId);

  const activeHackathonId = hackathonId || selectedHackathonId;

  const tabItems = [
    {
      key: TAB_KEYS.APPROVAL,
      label: (
        <span><TeamOutlined /> Phê duyệt Đội thi</span>
      ),
      children: <ApprovalTable hackathonId={activeHackathonId} />,
    },
  ];

  if (!activeHackathonId && isLoadingHackathons) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin tip="Đang tải sự kiện..." /></div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý Đội thi</Title>
          <Text type="secondary">Điều phối viên: Phê duyệt và quản lý hồ sơ đội thi.</Text>
        </div>
        
        {!hackathonId && (
          <Space>
            <Text strong>Sự kiện:</Text>
            <Select
              showSearch
              placeholder="Chọn Hackathon"
              loading={isLoadingHackathons}
              value={selectedHackathonId}
              onChange={(value) => setSelectedHackathonId(value)}
              style={{ width: 300 }}
              suffixIcon={<SearchOutlined />}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={hackathons.map(h => ({ value: h.id, label: h.hackathonName || h.name || `Hackathon #${h.id}` }))}
            />
          </Space>
        )}
      </div>

      {!activeHackathonId && !isLoadingHackathons && (
        <Card>
          <Text type="danger">Chưa chọn sự kiện Hackathon nào. Vui lòng chọn ở phía trên để tiếp tục.</Text>
        </Card>
      )}

      {activeHackathonId && (
        <Card bordered={false} className="shadow-sm" style={{ borderRadius: 8 }}>
        <Tabs 
          defaultActiveKey={TAB_KEYS.APPROVAL} 
          items={tabItems} 
          size="large"
          animated={{ inkBar: true, tabPane: true }}
        />
      </Card>
      )}
    </div>
  );
};

export default CoordinatorTeamPage;