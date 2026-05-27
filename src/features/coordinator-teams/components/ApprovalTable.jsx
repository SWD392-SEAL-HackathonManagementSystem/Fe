import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  Modal,
  Input,
  Tooltip,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  WarningOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useApproval } from "../hooks/useApproval";
import { TEAM_STATUS } from "../constants/team.constants";

const ApprovalTable = ({ hackathonId }) => {
  // 1. Lấy toàn bộ "vũ khí" từ Hook
  const {
    teams,
    isLoading,
    isActionLoading,
    fetchTeams,
    handleApprove,
    handleReject,
    handleDisband,
    handleBulkApprove,
  } = useApproval(hackathonId);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    teamId: null,
    reason: "",
  });

  useEffect(() => {
    if (hackathonId) {
      fetchTeams(TEAM_STATUS.PENDING);
    }
  }, [hackathonId, fetchTeams]);

  const columns = [
    {
      title: "Tên đội",
      dataIndex: "teamName",
      key: "teamName",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Trưởng nhóm",
      dataIndex: "leaderName",
      key: "leaderName",
    },
    {
      title: "Thành viên",
      dataIndex: "memberStats",
      key: "memberStats",
      align: "center",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: record.isInvalidMemberCount ? '#cf1322' : 'inherit' }}>
            {text}
          </strong>
          {record.isInvalidMemberCount && (
            <Tooltip title="Đội thi hợp lệ phải có từ 3 đến 5 thành viên.">
              <Tag color="error" style={{ margin: 0, marginTop: 4 }}>
                Không đủ ĐK
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registeredAt",
      key: "registeredAt",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag color={record.statusColor}>{record.status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip
            title={
              record.isInvalidMemberCount
                ? "Đội phải có từ 3-5 thành viên mới được duyệt"
                : ""
            }
          >
            <Popconfirm
              title="Duyệt đội thi này?"
              description="Đội sẽ được chuyển sang trạng thái ACTIVE."
              onConfirm={() => handleApprove(record.id)}
              okText="Duyệt"
              cancelText="Hủy"
              disabled={record.isInvalidMemberCount}
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={isActionLoading}
                disabled={record.isInvalidMemberCount}
                style={{
                  background: record.isInvalidMemberCount
                    ? undefined
                    : "#52c41a",
                  borderColor: record.isInvalidMemberCount
                    ? undefined
                    : "#52c41a",
                }}
              >
                Duyệt
              </Button>
            </Popconfirm>
          </Tooltip>
          <Popconfirm
            title="CẢNH BÁO: Xóa đội thi?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => handleDisband(record.id)}
            okText="Xóa luôn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={isActionLoading}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
    getCheckboxProps: (record) => ({
      disabled: record.isInvalidMemberCount,
    }),
  };

  const onBulkApprove = async () => {
    const success = await handleBulkApprove(selectedRowKeys);
    if (success) setSelectedRowKeys([]);
  };

  const onConfirmReject = async () => {
    if (!rejectModal.reason.trim()) return;
    const success = await handleReject(rejectModal.teamId, rejectModal.reason);
    if (success) setRejectModal({ open: false, teamId: null, reason: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <AnimatePresence>
          {selectedRowKeys.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Button
                type="primary"
                size="large"
                loading={isActionLoading}
                onClick={onBulkApprove}
                style={{
                  background:
                    "linear-gradient(90deg, #52c41a 0%, #389e0d 100%)",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(82, 196, 26, 0.4)",
                  borderRadius: "8px",
                  fontWeight: 600,
                }}
              >
                <CheckOutlined /> Duyệt hàng loạt ({selectedRowKeys.length} đội)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={teams}
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} đội`,
        }}
        rowClassName="premium-table-row"
        locale={{
          emptyText: (
            <div style={{ padding: "40px 0" }}>
              <InboxOutlined
                style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
              />
              <div style={{ color: "#8c8c8c", fontSize: 16 }}>
                Không có đội nào đang chờ duyệt
              </div>
            </div>
          ),
        }}
      />
      <Modal
        title="Từ chối đội thi"
        open={rejectModal.open}
        onOk={onConfirmReject}
        onCancel={() =>
          setRejectModal({ open: false, teamId: null, reason: "" })
        }
        confirmLoading={isActionLoading}
        okButtonProps={{ danger: true, disabled: !rejectModal.reason.trim() }}
        okText="Từ chối"
        cancelText="Hủy"
      >
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối..."
          value={rejectModal.reason}
          onChange={(e) =>
            setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
          }
        />
      </Modal>
    </motion.div>
  );
};

export default ApprovalTable;
