import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Card, Alert, Typography, Switch, Select } from 'antd';
import { Plus, Edit, Trash2 } from 'lucide-react';
import CriteriaFormModal from '../components/CriteriaFormModal';
import { useCriteriaManagement } from '../hooks/useCriteriaManagement';
import { CRITERIA_TYPES, CRITERIA_COLORS } from '../constants/criteria.constants';

const { Title, Text } = Typography;
const { Option } = Select;

const CriteriaManagementPage = ({ hackathonId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloneModalVisible, setIsCloneModalVisible] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState(null);
  const [cloneSourceType, setCloneSourceType] = useState('TRACK'); // 'TRACK' | 'ROUND'
  const [editingCriteria, setEditingCriteria] = useState(null);

  // Gọi Custom Hook để tách toàn bộ logic tính toán ra khỏi UI
  const {
    hackathonRounds,
    hackathonTracks,
    currentRound,
    roundTracks,
    currentCriteria,
    totalWeight,
    isWeightValid,
    selectedRoundId,
    setSelectedRoundId,
    selectedTrackId,
    setSelectedTrackId,
    handleAutoBalance,
    handleCloneCriteria,
    handleSaveCriteria,
    deleteCriteria,
    updateRound,
  } = useCriteriaManagement(hackathonId);

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
    message.success('Đã xoá tiêu chí');
  };

  const handleModalFinish = (values) => {
    handleSaveCriteria(values, editingCriteria?.id);
    setIsModalVisible(false);
    setEditingCriteria(null);
  };

  const executeClone = () => {
    if (!cloneSourceId) return;
    const clonedCount = handleCloneCriteria(
      cloneSourceType === 'ROUND' ? cloneSourceId : null,
      cloneSourceType === 'TRACK' ? cloneSourceId : null
    );
    
    if (clonedCount > 0) {
      message.success(`Đã sao chép thành công ${clonedCount} tiêu chí.`);
    } else {
      message.warning('Không tìm thấy tiêu chí nào từ nguồn đã chọn để sao chép.');
    }
    setIsCloneModalVisible(false);
    setCloneSourceId(null);
  };

  const getTypeColor = (type) => {
    return CRITERIA_COLORS[type] || CRITERIA_COLORS.DEFAULT;
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
      align: 'center',
    },
    {
      title: 'Tên tiêu chí',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'right',
      render: (weight, record) => (
        <span style={{ fontWeight: 600, color: record.type === CRITERIA_TYPES.PENALTY ? '#ff4d4f' : 'inherit' }}>
          {record.type === CRITERIA_TYPES.PENALTY ? '-' : weight?.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Điểm tối đa',
      dataIndex: 'max_score',
      key: 'max_score',
      width: 100,
      align: 'right',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleEdit(record)} />
          <Popconfirm 
            title="Bạn có chắc muốn xoá?" 
            onConfirm={() => handleDelete(record.id)} 
            okText="Xoá" 
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
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space size="large" style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 300 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Vòng thi (Round):</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn vòng thi"
              value={selectedRoundId}
              onChange={(val) => {
                setSelectedRoundId(val);
              }}
            >
              {hackathonRounds.map(r => (
                <Option key={r.id} value={r.id}>{r.name} {r.is_final ? '(Chung Kết)' : '(Sơ Loại)'}</Option>
              ))}
            </Select>
          </div>
          
          {/* Ẩn dropdown Track nếu Vòng thi đang chọn là Chung kết (is_final) */}
          {currentRound && !currentRound.is_final && (
            <div style={{ minWidth: 300 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Bảng đấu (Track):</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn bảng đấu"
                value={selectedTrackId}
                onChange={setSelectedTrackId}
              >
                {roundTracks.map(t => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
              </Select>
            </div>
          )}
        </Space>
      </Card>

      {(!currentRound || (!currentRound.is_final && !selectedTrackId)) ? (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 12 }}>
          <Text type="secondary">Vui lòng chọn Vòng thi {currentRound && !currentRound.is_final ? 'và Bảng đấu ' : ''}để thiết lập tiêu chí.</Text>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              {currentRound.is_final 
                ? currentRound.name 
                : `${currentRound.name} - Bảng: ${roundTracks.find(t => t.id === selectedTrackId)?.name}`}
            </Title>
            <Space>
              <Text>Kích hoạt vòng thi:</Text>
              <Switch 
                checked={currentRound?.is_active} 
                onChange={(checked) => updateRound(currentRound.id, { is_active: checked })} 
              />
            </Space>
          </div>

          {currentCriteria.length > 0 && !isWeightValid && (
            <Alert 
              type="error" 
              showIcon 
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={<strong>Cảnh báo trọng số</strong>}
              description={<span>Tổng trọng số hiện tại là {totalWeight.toFixed(2)}. Tổng trọng số bắt buộc phải bằng 1.0 (không tính loại PENALTY).</span>}
              action={<Button size="small" type="primary" danger onClick={handleAutoBalance}>Cân bằng tự động</Button>}
            />
          )}

          {currentCriteria.length > 0 && isWeightValid && (
            <Alert 
              type="success" 
              showIcon 
              style={{ marginBottom: 16, borderRadius: 8 }} 
              message={<strong>Trọng số hợp lệ: {totalWeight.toFixed(2)}</strong>} 
            />
          )}

          <Card style={{ borderRadius: 12 }}>
            <Table 
              columns={columns} 
              dataSource={currentCriteria} 
              rowKey="id" 
              pagination={false}
              locale={{ emptyText: 'Chưa có tiêu chí nào được thiết lập.' }}
              footer={() => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <Button 
                    type="default" 
                    icon={<Edit size={16} />} 
                    onClick={() => setIsCloneModalVisible(true)}
                  >
                    Sao chép tiêu chí
                  </Button>
                  <Button type="dashed" icon={<Plus size={16} />} onClick={handleAdd}>
                    Thêm tiêu chí mới
                  </Button>
                </div>
              )}
            />
          </Card>

          <CriteriaFormModal
            visible={isModalVisible}
            title={editingCriteria ? 'Cập nhật tiêu chí' : 'Thêm tiêu chí'}
            initialValues={editingCriteria}
            onCancel={() => { setIsModalVisible(false); setEditingCriteria(null); }}
            onFinish={handleModalFinish}
          />

          {/* Modal Sao chép tiêu chí */}
          {isCloneModalVisible && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Card style={{ width: 500, borderRadius: 8 }} title="Sao chép tiêu chí từ vòng/bảng khác">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Chọn nguồn để sao chép:</Text>
                  <Select
                    style={{ width: '100%', marginTop: 8 }}
                    placeholder="Chọn bảng đấu hoặc vòng thi"
                    value={cloneSourceId ? `${cloneSourceType}_${cloneSourceId}` : undefined}
                    onChange={(val) => {
                      const [type, id] = val.split('_');
                      setCloneSourceType(type);
                      setCloneSourceId(parseInt(id));
                    }}
                  >
                    {hackathonRounds.map(r => {
                      if (r.is_final) {
                        return (
                          <Option key={`ROUND_${r.id}`} value={`ROUND_${r.id}`} disabled={currentRound?.is_final && r.id === selectedRoundId}>
                            Vòng Chung kết: {r.name}
                          </Option>
                        );
                      } else {
                        // Tìm tracks của round này
                        const rTracks = hackathonTracks.filter(t => t.round_id === r.id);
                        return rTracks.map(t => (
                          <Option key={`TRACK_${t.id}`} value={`TRACK_${t.id}`} disabled={!currentRound?.is_final && t.id === selectedTrackId}>
                            Vòng {r.name} - Bảng: {t.name}
                          </Option>
                        ));
                      }
                    })}
                  </Select>
                </div>
                <Alert type="info" showIcon message="Hệ thống sẽ sao chép toàn bộ tiêu chí (bao gồm Trọng số và Điểm tối đa) từ nguồn đã chọn vào vòng/bảng đấu hiện tại." style={{ marginBottom: 24 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <Button onClick={() => setIsCloneModalVisible(false)}>Hủy</Button>
                  <Button type="primary" disabled={!cloneSourceId} onClick={executeClone}>Tiến hành Sao chép</Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CriteriaManagementPage;