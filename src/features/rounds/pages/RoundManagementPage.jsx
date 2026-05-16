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
    message.success('Round deleted successfully');
  };

  const handleModalFinish = (values) => {
    if (editingRound) {
      updateRound(editingRound.id, values);
      message.success('Round updated successfully');
    } else {
      addRound(values);
      message.success('Round created successfully');
    }
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Order',
      dataIndex: 'sequence_order',
      key: 'sequence_order',
      width: 80,
    },
    {
      title: 'Name',
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
      title: 'Submission Period',
      key: 'period',
      render: (_, record) => (
        <div style={{ fontSize: 13 }}>
          <div>Open: {formatDate(record.submission_open)}</div>
          <div>Deadline: {formatDate(record.submission_deadline)}</div>
        </div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'coding_duration_hours',
      key: 'duration',
      render: (val) => val ? `${val}h` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
            title="Delete Round"
            description="Are you sure you want to delete this round?"
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Select 
            placeholder="Filter by Track" 
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
              Table
            </Button>
            <Button 
              icon={<Calendar size={16} />} 
              type={viewMode === 'timeline' ? 'primary' : 'default'}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
          </Button.Group>
        </Space>
        
        <Button 
          type="primary" 
          icon={<Plus size={16} />} 
          onClick={handleAdd}
          disabled={hackathonTracks.length === 0}
        >
          Add Round
        </Button>
      </div>

      {hackathonTracks.length === 0 ? (
        <Card>Please create at least one track before managing rounds.</Card>
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
                      {round.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                  <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                    Track: {hackathonTracks.find(t => t.id === round.track_id)?.name} | 
                    Deadline: {formatDate(round.submission_deadline)}
                  </div>
                  <div>
                    <Button size="small" icon={<Edit size={14} />} onClick={() => handleEdit(round)}>Edit</Button>
                  </div>
                </div>
              ),
            }))}
          />
          {filteredRounds.length === 0 && <div>No rounds found.</div>}
        </Card>
      )}

      <RoundFormModal
        visible={isModalVisible}
        title={editingRound ? 'Edit Round' : 'Add Round'}
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
