import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Modal, Input, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { useApproval } from '../../hooks/useApproval';
import { TEAM_STATUS } from '../../constants/team.constants';

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
    handleBulkApprove
  } = useApproval(hackathonId);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [rejectModal, setRejectModal] = useState({ open: false, teamId: null, reason: '' });

  useEffect(() => {
    if (hackathonId) {
      fetchTeams(TEAM_STATUS.PENDING);
    }
  }, [hackathonId, fetchTeams]);

  const columns = [
    { 
      title: 'Tên đội', 
      dataIndex: 'teamName', 
      key: 'teamName',
      render: (text) => <strong>{text}</strong>
    },
    { 
      title: 'Trưởng nhóm', 
      dataIndex: 'leaderName', 
      key: 'leaderName' 
    },
    { 
      title: 'Thành viên', 
      dataIndex: 'memberStats', 
      key: 'memberStats',
      align: 'center',
      render: (text, record) => (
        <Space>
          {text}
          {record.isInvalidMemberCount && (
            <Tooltip title="Đội phải có từ 3-5 thành viên!">
              <WarningOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    { 
      title: 'Ngày đăng ký', 
      dataIndex: 'registeredAt', 
      key: 'registeredAt' 
    },
    { 
      title: 'Trạng thái', 
      key: 'status',
      render: (_, record) => (
        <Tag color={record.statusColor}>{record.status}</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Duyệt đội thi này?"
            description="Đội sẽ được chuyển sang trạng thái ACTIVE."
            onConfirm={() => handleApprove(record.id)}
            okText="Duyệt"
            cancelText="Hủy"
          >
            <Button 
              type="primary" 
              icon={<CheckOutlined />} 
              loading={isActionLoading}
              style={{ background: '#52c41a' }}
            >
              Duyệt
            </Button>
          </Popconfirm>

          <Button 
            danger 
            icon={<CloseOutlined />} 
            loading={isActionLoading}
            onClick={() => setRejectModal({ open: true, teamId: record.id, reason: '' })}
          >
            Từ chối
          </Button>

          <Popconfirm
            title="CẢNH BÁO: Xóa đội thi?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => handleDisband(record.id)}
            okText="Xóa luôn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} loading={isActionLoading} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
  };

  const onBulkApprove = async () => {
    const success = await handleBulkApprove(selectedRowKeys);
    if (success) setSelectedRowKeys([]);
  };

  const onConfirmReject = async () => {
    if (!rejectModal.reason.trim()) return;
    const success = await handleReject(rejectModal.teamId, rejectModal.reason);
    if (success) setRejectModal({ open: false, teamId: null, reason: '' });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          disabled={selectedRowKeys.length === 0}
          loading={isActionLoading}
          onClick={onBulkApprove}
        >
          Duyệt hàng loạt ({selectedRowKeys.length})
        </Button>
      </div>
      <Table 
        rowSelection={rowSelection}
        columns={columns} 
        dataSource={teams} 
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Không có đội nào đang chờ duyệt' }}
      />
      <Modal
        title="Từ chối đội thi"
        open={rejectModal.open}
        onOk={onConfirmReject}
        onCancel={() => setRejectModal({ open: false, teamId: null, reason: '' })}
        confirmLoading={isActionLoading}
        okButtonProps={{ danger: true, disabled: !rejectModal.reason.trim() }}
        okText="Từ chối"
        cancelText="Hủy"
      >
        <Input.TextArea 
          rows={4} 
          placeholder="Nhập lý do từ chối..."
          value={rejectModal.reason}
          onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
        />
      </Modal>
    </div>
  );
};

export default ApprovalTable;