import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Card, Alert, Typography, Switch, Modal, Select, Spin } from 'antd';
import { Plus, Edit, Trash2, ArrowLeft, Copy, Scale, ExternalLink } from 'lucide-react';
import CriteriaFormModal from '../components/CriteriaFormModal';
import { criteriaService } from '../services/criteriaService';
import { roundService } from '../../rounds/services/roundService';
import { trackService } from '../../tracks/services/trackService';
import { mapCriterionToFE, mapCriterionToBE } from '../mappers/criteriaMapper';
import { mapRoundToFE } from '../../rounds/mappers/roundMapper';

const { Title, Text } = Typography;
const { Option } = Select;

const CriteriaManagementPage = ({ hackathonId, roundId, roundName, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [weightSummary, setWeightSummary] = useState(null);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  
  // State for cloning
  const [isCloneModalVisible, setIsCloneModalVisible] = useState(false);
  const [cloneSourceRound, setCloneSourceRound] = useState(null);
  const [cloneSourceTrack, setCloneSourceTrack] = useState(null);
  const [allRounds, setAllRounds] = useState([]);
  const [allTracks, setAllTracks] = useState([]);

  // Fetch criteria logic
  const fetchCriteriaList = async (trackId = null) => {
    try {
      setLoading(true);
      let res;
      const activeRound = currentRound;
      const isFinal = activeRound?.is_final || activeRound?.round_type === 'FINAL';
      
      if (isFinal) {
        res = await criteriaService.listByFinalRound(roundId);
      } else {
        const activeTrackId = trackId || selectedTrackId;
        if (!activeTrackId) {
          setCriteriaList([]);
          setWeightSummary(null);
          return;
        }
        res = await criteriaService.listByTrack(activeTrackId);
      }
      
      if (res) {
        const items = (res.items || []).map(mapCriterionToFE);
        setCriteriaList(items);
        setWeightSummary(res.weightSummary || null);
      } else {
        setCriteriaList([]);
        setWeightSummary(null);
      }
    } catch (error) {
      message.error(error.message || 'Lỗi khi tải tiêu chí');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  const loadData = async () => {
    try {
      setLoading(true);
      const roundDetail = await roundService.getById(roundId);
      const feRound = mapRoundToFE(roundDetail);
      setCurrentRound(feRound);
      
      const isFinal = feRound?.is_final || feRound?.round_type === 'FINAL';
      
      if (!isFinal) {
        const trackList = await trackService.listByRound(roundId);
        setTracks(trackList || []);
        if (trackList && trackList.length > 0) {
          setSelectedTrackId(trackList[0].id);
          const res = await criteriaService.listByTrack(trackList[0].id);
          if (res) {
            setCriteriaList((res.items || []).map(mapCriterionToFE));
            setWeightSummary(res.weightSummary || null);
          }
        } else {
          setCriteriaList([]);
          setWeightSummary(null);
        }
      } else {
        const res = await criteriaService.listByFinalRound(roundId);
        if (res) {
          setCriteriaList((res.items || []).map(mapCriterionToFE));
          setWeightSummary(res.weightSummary || null);
        }
      }
    } catch (error) {
      message.error(error.message || 'Lỗi khi tải dữ liệu ban đầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roundId]);

  const handleTrackChange = async (value) => {
    setSelectedTrackId(value);
    await fetchCriteriaList(value);
  };

  const handleAdd = () => {
    setEditingCriteria(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCriteria(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await criteriaService.delete(id);
      message.success('Đã xóa tiêu chí thành công');
      await fetchCriteriaList();
    } catch (error) {
      message.error(error.message || 'Lỗi khi xóa tiêu chí');
      setLoading(false);
    }
  };

  const handleModalFinish = async (values) => {
    try {
      setLoading(true);
      const payload = mapCriterionToBE(values);
      const isFinal = currentRound?.is_final || currentRound?.round_type === 'FINAL';

      if (editingCriteria) {
        await criteriaService.update(editingCriteria.id, payload);
        message.success('Cập nhật tiêu chí thành công');
      } else {
        if (isFinal) {
          await criteriaService.createForFinalRound(roundId, payload);
        } else {
          if (!selectedTrackId) {
            message.error('Vui lòng chọn Track trước khi tạo tiêu chí');
            setLoading(false);
            return;
          }
          await criteriaService.createForTrack(selectedTrackId, payload);
        }
        message.success('Tạo tiêu chí mới thành công');
      }
      setIsModalVisible(false);
      setEditingCriteria(null);
      await fetchCriteriaList();
    } catch (error) {
      message.error(error.message || 'Lỗi khi lưu tiêu chí');
      setLoading(false);
    }
  };

  const handleAutoBalance = async () => {
    if (criteriaList.length === 0) return;
    try {
      setLoading(true);
      const evenWeight = parseFloat((1.0 / criteriaList.length).toFixed(2));
      let remaining = 1.0;

      await Promise.all(
        criteriaList.map((c, index) => {
          let targetWeight;
          if (index === criteriaList.length - 1) {
            targetWeight = parseFloat(remaining.toFixed(2));
          } else {
            targetWeight = evenWeight;
            remaining -= evenWeight;
          }
          
          return criteriaService.update(c.id, {
            name: c.name,
            type: c.type,
            weight: targetWeight,
            maxScore: c.max_score,
            description: c.description,
            rubricUrl: c.rubric_url,
            displayOrder: c.display_order
          });
        })
      );
      
      message.success('Đã tự động cân bằng trọng số tiêu chí');
      await fetchCriteriaList();
    } catch (error) {
      message.error(error.message || 'Lỗi khi tự động cân bằng');
      setLoading(false);
    }
  };

  const handleCloneCriteria = async () => {
    try {
      setLoading(true);
      const isFinal = currentRound?.is_final || currentRound?.round_type === 'FINAL';
      if (isFinal) {
        const list = await roundService.listByHackathon(hackathonId);
        setAllRounds((list || []).filter(r => r.id !== roundId));
      } else {
        const list = await trackService.listByHackathon(hackathonId);
        setAllTracks((list || []).filter(t => t.id !== selectedTrackId));
      }
      setIsCloneModalVisible(true);
    } catch (error) {
      message.error(error.message || 'Lỗi khi tải dữ liệu để clone');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneConfirm = async () => {
    const isFinal = currentRound?.is_final || currentRound?.round_type === 'FINAL';
    if (isFinal && !cloneSourceRound) {
      message.error('Vui lòng chọn Vòng thi nguồn');
      return;
    }
    if (!isFinal && !cloneSourceTrack) {
      message.error('Vui lòng chọn Track nguồn');
      return;
    }

    try {
      setLoading(true);
      if (isFinal) {
        await criteriaService.cloneForFinalRound(roundId, {
          sourceRoundId: cloneSourceRound,
          replaceExisting: true
        });
      } else {
        await criteriaService.cloneForTrack(selectedTrackId, {
          sourceTrackId: cloneSourceTrack,
          replaceExisting: true
        });
      }
      message.success('Đã sao chép tiêu chí thành công');
      setIsCloneModalVisible(false);
      setCloneSourceRound(null);
      setCloneSourceTrack(null);
      await fetchCriteriaList();
    } catch (error) {
      message.error(error.message || 'Lỗi khi sao chép tiêu chí');
      setLoading(false);
    }
  };

  const handleToggleActive = async (checked) => {
    try {
      if (checked) {
        await roundService.activate(roundId);
        message.success('Kích hoạt vòng thi thành công');
      } else {
        message.warning('Backend không hỗ trợ tắt kích hoạt thủ công. Trạng thái hoạt động sẽ tự tắt khi vòng thi khác được kích hoạt.');
      }
      const roundDetail = await roundService.getById(roundId);
      setCurrentRound(mapRoundToFE(roundDetail));
    } catch (error) {
      message.error(error.message || 'Lỗi khi kích hoạt vòng thi');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'TECHNICAL':
        return 'blue';
      case 'SOFT_SKILL':
        return 'orange';
      case 'PENALTY':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 80,
      align: 'center',
      render: (text) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Tên tiêu chí',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Loại',
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
      render: (weight) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          {Number(weight).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Điểm tối đa',
      dataIndex: 'max_score',
      key: 'max_score',
      width: 110,
      align: 'right',
      render: (score) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          {score}
        </span>
      ),
    },
    {
      title: 'Mô tả',
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
      title: 'Thao tác',
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
            title="Xóa tiêu chí"
            description="Bạn có chắc chắn muốn xóa tiêu chí này?"
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

  const totalWeight = weightSummary ? weightSummary.total : 0;
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;
  const isFinal = currentRound?.is_final || currentRound?.round_type === 'FINAL';

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16
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
              Thiết lập tiêu chí chấm điểm
            </Text>
            <Title level={3} style={{ margin: 0 }}>
              {roundName || 'Quản lý Criteria'}
            </Title>
          </div>
        </div>
        <Space wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <Text>Vòng thi hoạt động:</Text>
            <Switch 
              checked={currentRound?.is_active} 
              onChange={handleToggleActive} 
            />
          </div>
          <Button
            icon={<Copy size={16} />}
            onClick={handleCloneCriteria}
            disabled={!isFinal && !selectedTrackId}
          >
            Sao chép tiêu chí
          </Button>
        </Space>
      </div>

      {/* Select Track for Preliminary Round */}
      {!isFinal && (
        <Card style={{ marginBottom: 16, borderRadius: 12 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Chọn Bảng đấu (Track):</span>
            <Select
              style={{ width: 300 }}
              placeholder="Chọn track để cấu hình tiêu chí"
              value={selectedTrackId}
              onChange={handleTrackChange}
            >
              {tracks.map(t => (
                <Option key={t.id} value={t.id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </Space>
        </Card>
      )}

      {loading && criteriaList.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></Card>
      ) : (
        <>
          {/* Weight Warning */}
          {criteriaList.length > 0 && !isWeightValid && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={
                <strong>Tổng trọng số không bằng 1.0 (100%)</strong>
              }
              description={
                <span>
                  Tổng trọng số hiện tại của các tiêu chí là{' '}
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
                  . Bạn cần thiết lập tổng trọng số đạt chuẩn đúng{' '}
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
                  để có thể kích hoạt vòng thi này. (Điểm phạt Penalty sẽ không được tính vào tổng trọng số này).
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
                  Tự động cân bằng
                </Button>
              }
            />
          )}

          {/* Weight Success */}
          {criteriaList.length > 0 && isWeightValid && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={
                <span>
                  Tổng trọng số tiêu chí đạt yêu cầu:{' '}
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
              dataSource={criteriaList}
              rowKey="id"
              pagination={false}
              loading={loading}
              locale={{ emptyText: (!isFinal && !selectedTrackId) ? 'Vui lòng tạo track trước.' : 'Chưa có tiêu chí nào được tạo.' }}
              footer={() => (
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="link"
                    icon={<Plus size={16} />}
                    onClick={handleAdd}
                    disabled={!isFinal && !selectedTrackId}
                  >
                    Thêm tiêu chí mới
                  </Button>
                </div>
              )}
            />
          </Card>
        </>
      )}

      {/* Form Modal */}
      {isModalVisible && (
        <CriteriaFormModal
          visible={isModalVisible}
          title={editingCriteria ? 'Sửa Tiêu chí' : 'Thêm Tiêu chí'}
          initialValues={editingCriteria}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingCriteria(null);
          }}
          onFinish={handleModalFinish}
        />
      )}

      {/* Clone Criteria Modal */}
      <Modal
        title="Sao chép tiêu chí đánh giá"
        open={isCloneModalVisible}
        onOk={handleCloneConfirm}
        onCancel={() => {
          setIsCloneModalVisible(false);
          setCloneSourceRound(null);
          setCloneSourceTrack(null);
        }}
        okText="Sao chép"
        okButtonProps={{ disabled: isFinal ? !cloneSourceRound : !cloneSourceTrack }}
      >
        <div style={{ padding: '20px 0' }}>
          {isFinal ? (
            <>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Chọn Vòng chung kết nguồn để sao chép tiêu chí sang vòng hiện tại:
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn vòng thi"
                value={cloneSourceRound}
                onChange={setCloneSourceRound}
              >
                {allRounds.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name}
                  </Option>
                ))}
              </Select>
            </>
          ) : (
            <>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Chọn Bảng đấu (Track) nguồn để sao chép tiêu chí sang track hiện tại:
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn track"
                value={cloneSourceTrack}
                onChange={setCloneSourceTrack}
              >
                {allTracks.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CriteriaManagementPage;
