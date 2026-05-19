import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Card, Alert, Typography, Tooltip, Switch, Modal, Select, Form } from 'antd';
import { Plus, Edit, Trash2, ArrowLeft, Copy, Scale, ExternalLink } from 'lucide-react';
import CriteriaFormModal from '../components/CriteriaFormModal';
import { useAppContext } from '../../../app/AppContext';

const { Title, Text } = Typography;
const { Option } = Select;

const CriteriaManagementPage = ({ roundId, roundName, onBack }) => {
  const { criteria, addCriteria, updateCriteria, deleteCriteria, rounds, updateRound } = useAppContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloneModalVisible, setIsCloneModalVisible] = useState(false);
  const [cloneSourceRound, setCloneSourceRound] = useState(null);
  const [editingCriteria, setEditingCriteria] = useState(null);

  const currentRound = rounds.find(r => r.id === roundId);
  const otherRounds = rounds.filter(r => r.id !== roundId);

  // Filter criteria by the current round
  const roundCriteria = useMemo(
    () => criteria.filter((c) => c.round_id === roundId),
    [criteria, roundId]
  );

  // Calculate total weight
  const totalWeight = useMemo(
    () => roundCriteria.reduce((sum, c) => sum + c.weight, 0),
    [roundCriteria]
  );

  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleAdd = () => {
    setEditingCriteria(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCriteria(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteCriteria(id);
    message.success('Criteria deleted successfully');
  };

  const handleModalFinish = (values) => {
    if (editingCriteria) {
      updateCriteria(editingCriteria.id, values);
      message.success('Criteria updated successfully');
    } else {
      addCriteria({ ...values, round_id: roundId });
      message.success('Criteria created successfully');
    }
    setIsModalVisible(false);
    setEditingCriteria(null);
  };

  const handleAutoBalance = () => {
    if (roundCriteria.length === 0) return;
    const evenWeight = parseFloat((1.0 / roundCriteria.length).toFixed(2));
    let remaining = 1.0;

    roundCriteria.forEach((c, index) => {
      if (index === roundCriteria.length - 1) {
        // Last item gets the remainder to ensure exactly 1.0
        updateCriteria(c.id, { weight: parseFloat(remaining.toFixed(2)) });
      } else {
        updateCriteria(c.id, { weight: evenWeight });
        remaining -= evenWeight;
      }
    });
    message.success('Weights auto-balanced to sum 1.0');
  };

  const handleCloneCriteria = () => {
    setIsCloneModalVisible(true);
  };

  const handleCloneConfirm = () => {
    if (!cloneSourceRound) {
      message.error('Please select a source round');
      return;
    }
    const sourceCriteria = criteria.filter((c) => c.round_id === cloneSourceRound);
    if (sourceCriteria.length === 0) {
      message.warning('Selected round has no criteria to clone');
      return;
    }
    sourceCriteria.forEach((c) => {
      addCriteria({
        round_id: roundId,
        name: `${c.name} (Copy)`,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
        description: c.description,
        display_order: c.display_order,
        rubric_url: c.rubric_url,
      });
    });
    message.success(`Cloned ${sourceCriteria.length} criteria`);
    setIsCloneModalVisible(false);
    setCloneSourceRound(null);
  };

  const handleToggleActive = (checked) => {
    updateRound(roundId, { is_active: checked });
    message.success(`Round ${checked ? 'activated' : 'deactivated'}`);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Technical':
        return 'blue';
      case 'Innovation':
        return 'orange';
      case 'General':
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Order',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
      align: 'center',
      render: (text) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Criteria Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'right',
      render: (weight) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          {weight.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Max Score',
      dataIndex: 'max_score',
      key: 'max_score',
      width: 100,
      align: 'right',
      render: (score) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          {score}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Rubric',
      dataIndex: 'rubric_url',
      key: 'rubric_url',
      width: 80,
      align: 'center',
      render: (url) => 
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Criteria"
            description="Are you sure you want to delete this criteria?"
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
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {onBack && (
            <Button
              icon={<ArrowLeft size={18} />}
              onClick={onBack}
              style={{ marginTop: 4 }}
            />
          )}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Judging Setup
            </Text>
            <Title level={3} style={{ margin: 0 }}>
              {roundName || 'Criteria Management'}
            </Title>
          </div>
        </div>
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <Text>Round Active:</Text>
            <Switch 
              checked={currentRound?.is_active} 
              onChange={handleToggleActive} 
            />
          </div>
          <Button
            icon={<Copy size={16} />}
            onClick={handleCloneCriteria}
          >
            Clone Criteria
          </Button>
        </Space>
      </div>

      {/* Weight Warning */}
      {roundCriteria.length > 0 && !isWeightValid && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={
            <strong>Total Weight Mismatch</strong>
          }
          description={
            <span>
              The current criteria weights sum to{' '}
              <code
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {totalWeight.toFixed(2)}
              </code>
              . The total weight should equal exactly{' '}
              <code
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                1.0
              </code>{' '}
              to proceed with judging. (Soft warning: You can still save)
            </span>
          }
          action={
            <Button
              size="small"
              type="primary"
              danger
              icon={<Scale size={14} />}
              onClick={handleAutoBalance}
            >
              Auto-Balance
            </Button>
          }
        />
      )}

      {/* Weight Success */}
      {roundCriteria.length > 0 && isWeightValid && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={
            <span>
              Total weight is valid:{' '}
              <code
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {totalWeight.toFixed(2)}
              </code>
            </span>
          }
        />
      )}

      {/* Criteria Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={roundCriteria}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No criteria defined yet. Add your first criteria below.' }}
          footer={() => (
            <div style={{ textAlign: 'center' }}>
              <Button
                type="link"
                icon={<Plus size={16} />}
                onClick={handleAdd}
              >
                Add New Criteria
              </Button>
            </div>
          )}
        />
      </Card>

      {/* Bottom Action Bar */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Button onClick={onBack}>Discard Changes</Button>
        <Button
          type="primary"
          disabled={roundCriteria.length === 0}
        >
          Save Criteria Map
        </Button>
      </div>

      {/* Form Modal */}
      <CriteriaFormModal
        visible={isModalVisible}
        title={editingCriteria ? 'Edit Criteria' : 'Add Criteria'}
        initialValues={editingCriteria}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCriteria(null);
        }}
        onFinish={handleModalFinish}
      />

      {/* Clone Criteria Modal */}
      <Modal
        title="Clone Criteria from another Round"
        open={isCloneModalVisible}
        onOk={handleCloneConfirm}
        onCancel={() => {
          setIsCloneModalVisible(false);
          setCloneSourceRound(null);
        }}
        okText="Clone"
        okButtonProps={{ disabled: !cloneSourceRound }}
      >
        <div style={{ padding: '20px 0' }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>
            Select a source round to copy its criteria to the current round:
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a round"
            value={cloneSourceRound}
            onChange={setCloneSourceRound}
          >
            {otherRounds.map((r) => (
              <Option key={r.id} value={r.id}>
                {r.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default CriteriaManagementPage;
