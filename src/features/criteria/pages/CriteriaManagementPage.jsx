import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Card,
  Alert,
  Typography,
} from "antd";
import { Plus, Edit, Trash2, Copy, FileText } from "lucide-react";
import { useCriteriaManagement } from "../hooks/useCriteriaManagement";
import {
  CRITERIA_TYPES,
  CRITERIA_COLORS,
} from "../constants/criteria.constants";
import { CriteriaHeader } from "../components/CriteriaHeader";
import { CriteriaFormModal } from "../components/CriteriaFormModal";
import { CriteriaCloneModal } from "../components/CriteriaCloneModal";
import { CriteriaBatchModal } from "../components/CriteriaBatchModal";

const { Text } = Typography;

const CriteriaManagementPage = ({ hackathonId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCloneVisible, setIsCloneVisible] = useState(false);
  const [isBatchVisible, setIsBatchVisible] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);

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
    handleBatchSaveCriteria,
    deleteCriteria,
    updateRound,
  } = useCriteriaManagement(hackathonId);

  const handleEdit = (record) => {
    setEditingCriteria(record);
    setIsModalVisible(true);
  };

  const executeClone = (type, id, replaceExisting) => {
    handleCloneCriteria(
      type === "ROUND" ? id : null,
      type === "TRACK" ? id : null,
      replaceExisting,
    );
    setIsCloneVisible(false);
  };

  const columns = [
    {
      title: "Thứ tự",
      dataIndex: "display_order",
      key: "order",
      width: 80,
      align: "center",
    },
    {
      title: "Tên tiêu chí",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Phân loại",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type) => (
        <Tag color={CRITERIA_COLORS[type] || CRITERIA_COLORS.DEFAULT}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Trọng số",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      align: "right",
      render: (w, r) => (
        <span
          style={{
            fontWeight: 600,
            color: r.type === CRITERIA_TYPES.PENALTY ? "#ff4d4f" : "inherit",
          }}
        >
          {r.type === CRITERIA_TYPES.PENALTY ? "-" : w?.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Điểm tối đa",
      dataIndex: "max_score",
      key: "max_score",
      width: 110,
      align: "right",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, r) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(r)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xoá?"
            onConfirm={() => deleteCriteria(r.id)}
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
      <CriteriaHeader
        {...{
          hackathonRounds,
          roundTracks,
          currentRound,
          selectedRoundId,
          setSelectedRoundId,
          selectedTrackId,
          setSelectedTrackId,
          updateRound,
        }}
      />

      {!currentRound || (!currentRound.is_final && !selectedTrackId) ? (
        <Card
          style={{ textAlign: "center", padding: "40px 0", borderRadius: 12 }}
        >
          <Text type="secondary">
            Vui lòng chọn Vòng thi{" "}
            {currentRound && !currentRound.is_final ? "và Bảng đấu " : ""}để
            thiết lập tiêu chí.
          </Text>
        </Card>
      ) : (
        <>
          {currentCriteria.length > 0 && !isWeightValid && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={<strong>Cảnh báo trọng số</strong>}
              description={
                <span>
                  Tổng trọng số hiện tại là {totalWeight.toFixed(2)}. Tổng trọng
                  số bắt buộc phải bằng 1.0 (không tính loại PENALTY).
                </span>
              }
              action={
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={handleAutoBalance}
                >
                  Cân bằng tự động
                </Button>
              }
            />
          )}
          {currentCriteria.length > 0 && isWeightValid && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={
                <strong>Trọng số hợp lệ: {totalWeight.toFixed(2)}</strong>
              }
            />
          )}

          <Card style={{ borderRadius: 12 }}>
            <Table
              columns={columns}
              dataSource={currentCriteria}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "Chưa có tiêu chí nào được thiết lập." }}
              footer={() => (
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 16 }}
                >
                  <Button
                    type="default"
                    icon={<Copy size={16} />}
                    onClick={() => setIsCloneVisible(true)}
                  >
                    Sao chép tiêu chí
                  </Button>
                  <Button
                    type="dashed"
                    icon={<FileText size={16} />}
                    onClick={() => setIsBatchVisible(true)}
                  >
                    Thêm nhiều (Batch)
                  </Button>
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setEditingCriteria(null);
                      setIsModalVisible(true);
                    }}
                  >
                    Thêm 1 tiêu chí
                  </Button>
                </div>
              )}
            />
          </Card>

          <CriteriaFormModal
            visible={isModalVisible}
            title={editingCriteria ? "Cập nhật tiêu chí" : "Thêm tiêu chí"}
            initialValues={editingCriteria}
            onCancel={() => {
              setIsModalVisible(false);
              setEditingCriteria(null);
            }}
            onFinish={(vals) => {
              handleSaveCriteria(vals, editingCriteria?.id);
              setIsModalVisible(false);
            }}
          />

          <CriteriaCloneModal
            visible={isCloneVisible}
            onCancel={() => setIsCloneVisible(false)}
            onClone={executeClone}
            {...{
              currentHackathonId: hackathonId,
              hackathonRounds,
              hackathonTracks,
              currentRound,
              selectedRoundId,
              selectedTrackId,
            }}
          />

          <CriteriaBatchModal
            visible={isBatchVisible}
            onCancel={() => setIsBatchVisible(false)}
            onFinish={(items) => {
              handleBatchSaveCriteria(items);
              setIsBatchVisible(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CriteriaManagementPage;
