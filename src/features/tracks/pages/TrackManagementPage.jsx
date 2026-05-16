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
    message.success('Track deleted successfully');
  };

  const handleModalFinish = (values) => {
    if (editingTrack) {
      updateTrack(editingTrack.id, values);
      message.success('Track updated successfully');
    } else {
      addTrack({ ...values, hackathon_id: hackathonId });
      message.success('Track created successfully');
    }
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Teams',
      key: 'teams',
      render: (_, record) => `${record.max_teams || '∞'} (Max)`,
    },
    {
      title: 'Team Size',
      key: 'team_size',
      render: (_, record) => `${record.min_team_size} - ${record.max_team_size}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<Edit size={16} />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Track"
            description="Are you sure you want to delete this track? All associated rounds will also be deleted."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
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
          Add Track
        </Button>
      </div>

      <Table 
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
