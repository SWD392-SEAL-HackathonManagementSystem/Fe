import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Card } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import TrackFormModal from '../components/TrackFormModal';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { useAppContext } from '../../../app/AppContext';

const TrackManagementPage = ({ hackathonId }) => {
  const { tracks, addTrack, updateTrack, deleteTrack } = useAppContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);

  const hackathonTracks = tracks.filter(t => t.hackathon_id === hackathonId);

  const handleAdd = () => {
    setEditingTrack(null);
    setIsModalVisible(true);
  };

  const handleEdit = (track) => {
    setEditingTrack(track);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteTrack(id);
    message.success('Đã xóa track thành công');
  };

  const handleModalFinish = (values) => {
    if (editingTrack) {
      updateTrack(editingTrack.id, values);
      message.success('Đã cập nhật track thành công');
    } else {
      addTrack({ ...values, hackathon_id: hackathonId });
      message.success('Đã tạo track mới thành công');
    }
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Tên Track',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Số đội tối đa',
      key: 'teams',
      render: (_, record) => `${record.max_teams || 'Không giới hạn'}`,
    },
    {
      title: 'Sĩ số đội',
      key: 'team_size',
      render: (_, record) => `${record.min_team_size} - ${record.max_team_size} người`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
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
            title="Xóa Track"
            description="Bạn có chắc chắn muốn xóa track này? Tất cả các vòng thi liên quan cũng sẽ bị xóa."
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={handleAdd}
        >
          Thêm Track
        </Button>
      </div>

      <Table scroll={{ x: 'max-content' }}
        columns={columns} 
        dataSource={hackathonTracks} 
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No tracks found for this hackathon' }}
      />

      <TrackFormModal
        visible={isModalVisible}
        title={editingTrack ? 'Edit Track' : 'Add Track'}
        initialValues={editingTrack}
        onCancel={() => setIsModalVisible(false)}
        onFinish={handleModalFinish}
      />
    </div>
  );
};

export default TrackManagementPage;
