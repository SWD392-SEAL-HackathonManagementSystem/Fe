import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Select, Timeline, Tag, Card, Divider, Typography } from 'antd';
import { Plus, Edit, Trash2, Calendar, List } from 'lucide-react';
import RoundFormModal from '../components/RoundFormModal';
import { useAppContext } from '../../../app/AppContext';
import { formatDate } from '../../../shared/utils/date';

const { Option } = Select;

const RoundManagementPage = ({ hackathonId }) => {
  const { tracks, rounds, addRound, updateRound, deleteRound } = useAppContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [selectedTrackId, setSelectedTrackId] = useState(null);

  const hackathonTracks = tracks.filter(t => t.hackathon_id === hackathonId);
  
  // Filter rounds by tracks belonging to this hackathon
  const trackIds = hackathonTracks.map(t => t.id);
  let filteredRounds = rounds.filter(r => trackIds.includes(r.track_id));

  // Further filter by selected track if any
  if (selectedTrackId) {
    filteredRounds = filteredRounds.filter(r => r.track_id === selectedTrackId);
  }

  // Sort rounds by sequence order
  filteredRounds.sort((a, b) => a.sequence_order - b.sequence_order);

  const handleAdd = () => {
    setEditingRound(null);
    setIsModalVisible(true);
  };

  const handleEdit = (round) => {
    setEditingRound(round);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteRound(id);
    message.success('Đã xóa vòng thi thành công');
  };

  const handleModalFinish = (values) => {
    if (editingRound) {
      updateRound(editingRound.id, values);
      message.success('Đã cập nhật vòng thi thành công');
    } else {
      addRound(values);
      message.success('Đã tạo vòng thi mới thành công');
    }
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'sequence_order',
      key: 'sequence_order',
      width: 80,
    },
    {
      title: 'Tên vòng thi',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          {!selectedTrackId && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              Track: {hackathonTracks.find(t => t.id === record.track_id)?.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thời gian nộp bài',
      key: 'period',
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div>Mở: {formatDate(record.submission_open)}</div>
          <div>Hạn chót: {formatDate(record.submission_deadline)}</div>
        </div>
      ),
    },
    {
      title: 'Thời lượng',
      dataIndex: 'coding_duration_hours',
      key: 'duration',
      render: (val) => val ? `${val}h` : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'status',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<Edit size={16} />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa vòng thi"
            description="Bạn có chắc chắn muốn xóa vòng thi này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select 
            placeholder="Lọc theo Track" 
            style={{ width: 200 }} 
            allowClear
            onChange={setSelectedTrackId}
          >
            {hackathonTracks.map(t => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>
          <Button.Group>
            <Button 
              icon={<List size={16} />} 
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              Bảng
            </Button>
            <Button 
              icon={<Calendar size={16} />} 
              type={viewMode === 'timeline' ? 'primary' : 'default'}
              onClick={() => setViewMode('timeline')}
            >
              Dòng thời gian
            </Button>
          </Button.Group>
        </Space>
        
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={handleAdd}
          disabled={hackathonTracks.length === 0}
        >
          Thêm vòng thi
        </Button>
      </div>

      {hackathonTracks.length === 0 ? (
        <Card>Vui lòng tạo ít nhất một track trước khi quản lý các vòng thi.</Card>
      ) : viewMode === 'table' ? (
        <Table 
          columns={columns} 
          dataSource={filteredRounds} 
          rowKey="id"
          pagination={false}
        />
      ) : (
        <Card>
          <Timeline
            mode="left"
            items={filteredRounds.map(round => ({
              label: formatDate(round.submission_open),
              children: (
                <div style={{ paddingBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Title level={5} style={{ margin: 0 }}>{round.name}</Title>
                    <Tag color={round.is_active ? 'green' : 'default'}>
                      {round.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                    </Tag>
                  </div>
                  <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                    Track: {hackathonTracks.find(t => t.id === round.track_id)?.name} | 
                    Hạn chót: {formatDate(round.submission_deadline)}
                  </div>
                  <div>
                    <Button size="small" icon={<Edit size={14} />} onClick={() => handleEdit(round)}>Sửa</Button>
                  </div>
                </div>
              ),
            }))}
          />
          {filteredRounds.length === 0 && <div>Không tìm thấy vòng thi nào.</div>}
        </Card>
      )}

      <RoundFormModal
        visible={isModalVisible}
        title={editingRound ? 'Sửa vòng thi' : 'Thêm vòng thi'}
        initialValues={editingRound}
        tracks={hackathonTracks}
        onCancel={() => setIsModalVisible(false)}
        onFinish={handleModalFinish}
      />
    </div>
  );
};

// Internal Title component
const { Title } = Typography;

export default RoundManagementPage;
