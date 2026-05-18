import React, { useState } from 'react';
import { Card, Tabs, Button, Table, Form, Input, Modal, Select, Tag, Alert, message, notification, Space } from 'antd';
import { UserPlus, ShieldAlert, Trash2 } from 'lucide-react';
import { useAppContext } from '../../../app/AppContext';

const { Option } = Select;

const PeopleManagementPage = ({ hackathonId }) => {
  const { people, addPerson, assignments, assignRole, removeAssignment, tracks, rounds, addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Dữ liệu cho Hackathon hiện tại
  const hackathonTracks = tracks.filter(t => t.hackathon_id === hackathonId);
  const hackathonRounds = rounds.filter(r => hackathonTracks.map(t => t.id).includes(r.track_id));
  const hackathonAssignments = assignments.filter(a => a.hackathon_id === hackathonId);

  // Lọc lấy các Vòng Sơ Loại (Giả sử sequence_order = 1 là Sơ loại)
  const preliminaryRounds = hackathonRounds.filter(r => r.sequence_order === 1);

  // Logic kiểm tra Conflict 2 chiều (Mentor ↔ Judge)
  const getConflictWarnings = () => {
    const mentorIds = hackathonAssignments.filter(a => a.type === 'MENTOR').map(a => a.person_id);
    const judgeIds = hackathonAssignments.filter(a => a.type === 'JUDGE').map(a => a.person_id);
    const conflictIds = mentorIds.filter(id => judgeIds.includes(id));
    return conflictIds.map(id => people.find(p => p.id === id)?.name).filter(Boolean);
  };
  const conflicts = getConflictWarnings();

  // --- XỬ LÝ LƯU GUEST JUDGE VÀ BẮN THÔNG BÁO ---
  const handleAddGuestJudge = (values) => {
    addPerson({ ...values, role: 'JUDGE' });
    message.success('Đã tạo tài khoản và gửi lời mời Giám khảo thành công');
    setIsModalOpen(false);
    form.resetFields();

    addNotification({
      type: 'INVITATION',
      title: 'Đã gửi lời mời',
      description: `Đã tự động gửi email chứa link đăng nhập một lần tới ${values.name} (${values.email}).`
    });

    setTimeout(() => {
      notification.info({
        message: <strong>Đã gửi lời mời</strong>,
        description: `Hệ thống đã gửi email mời tới ${values.name}.`,
        placement: 'bottomRight',
        duration: 5,
      });
    }, 500);
  };

  // --- XỬ LÝ PHÂN CÔNG (ASSIGNMENT) ---
  const handleAssign = (values, type) => {
    const isExist = hackathonAssignments.some(a => 
      a.person_id === values.person_id && 
      a.type === type && 
      (a.track_id === values.track_id || a.round_id === values.round_id)
    );
    
    if (isExist) {
      return message.error('Nhân sự này đã được phân công vào hạng mục này rồi!');
    }

    assignRole({ ...values, hackathon_id: hackathonId, type });
    message.success(`Đã phân công ${type === 'MENTOR' ? 'Mentor' : 'Giám khảo'} thành công!`);
  };

  // --- HÀM TIỆN ÍCH HIỂN THỊ DỮ LIỆU BẢNG BẰNG TIẾNG VIỆT ---
  const getPersonName = (id) => people.find(p => p.id === id)?.name || 'Không xác định';
  const getTrackName = (id) => tracks.find(t => t.id === id)?.name || 'Không xác định';
  const getRoundName = (id) => rounds.find(r => r.id === id)?.name || 'Không xác định';

  // Dịch trạng thái lời mời sang tiếng Việt
  const renderInvitationStatus = (status) => {
    switch (status) {
      case 'ACCEPTED': return <Tag color="green">Đã chấp nhận</Tag>;
      case 'PENDING': return <Tag color="orange">Chờ phản hồi</Tag>;
      case 'SENT': return <Tag color="blue">Đã gửi</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  // Dịch và tô màu cho Vai trò Giám khảo
  const renderJudgeRole = (role) => {
    switch (role) {
      case 'HEAD': return <Tag color="red">Trưởng ban</Tag>;
      case 'CALIBRATION': return <Tag color="gold">Chấm chéo</Tag>; // gold là màu vàng cam đẹp nhất của Ant Design
      case 'NORMAL': return <Tag color="blue">Bình thường</Tag>;
      default: return <Tag color="blue">Bình thường</Tag>;
    }
  };

  const mentorColumns = [
    { title: 'Tên Mentor', key: 'name', render: (_, r) => <strong>{getPersonName(r.person_id)}</strong> },
    { title: 'Phụ trách Bảng đấu', key: 'track', render: (_, r) => <Tag color="blue">{getTrackName(r.track_id)}</Tag> },
    { title: 'Thao tác', key: 'action', render: (_, r) => <Button type="text" danger icon={<Trash2 size={16}/>} onClick={() => removeAssignment(r.id)} /> }
  ];

  const judgeColumnsAssign = [
    { title: 'Tên Giám khảo', key: 'name', render: (_, r) => <strong>{getPersonName(r.person_id)}</strong> },
    { title: 'Phụ trách Vòng thi', key: 'round', render: (_, r) => <Tag color="geekblue">{getRoundName(r.round_id)}</Tag> },
    { title: 'Vai trò', dataIndex: 'assignment_type', key: 'type', render: t => renderJudgeRole(t) },
    { title: 'Thao tác', key: 'action', render: (_, r) => <Button type="text" danger icon={<Trash2 size={16}/>} onClick={() => removeAssignment(r.id)} /> }
  ];

  return (
    <div>
      {conflicts.length > 0 && (
        <Alert
          message="Cảnh báo Xung đột Vai trò (Conflict Mentor ↔ Judge)"
          description={`Phát hiện cá nhân được phân công vừa làm Mentor vừa làm Judge: ${conflicts.join(', ')}. Hệ thống chỉ cảnh báo, không khóa thao tác.`}
          type="warning" showIcon icon={<ShieldAlert size={20} />} style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Card>
        <Tabs defaultActiveKey="1">
          {/* TAB 1: GUEST JUDGE */}
          <Tabs.TabPane tab="Giám khảo khách mời" key="1">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsModalOpen(true)}>
                Mời Giám khảo (Tạo TK Tạm)
              </Button>
            </div>
            <Table 
              dataSource={people.filter(p => p.role === 'JUDGE')} 
              rowKey="id" pagination={false}
              locale={{ emptyText: 'Chưa có giám khảo nào.' }}
              columns={[
                { title: 'Tên', dataIndex: 'name', key: 'name', render: t => <strong>{t}</strong> },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Tổ chức', dataIndex: 'institution', key: 'institution' },
                { title: 'Trạng thái Mời', dataIndex: 'status', key: 'status', render: s => renderInvitationStatus(s) }
              ]} 
            />
          </Tabs.TabPane>

          {/* TAB 2: MENTOR ASSIGNMENT */}
          <Tabs.TabPane tab="Phân công Mentor" key="2">
            <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
              <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'MENTOR')}>
                <Space size="middle" wrap>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn Mentor..." style={{ width: 220 }}>
                      {people.filter(p => p.role === 'MENTOR').map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="track_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn Bảng đấu (Track)..." style={{ width: 250 }}>
                      {hackathonTracks.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Phân công</Button>
                </Space>
              </Form>
            </Card>
            <Table dataSource={hackathonAssignments.filter(a => a.type === 'MENTOR')} columns={mentorColumns} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có Mentor nào được phân công' }} />
          </Tabs.TabPane>

          {/* TAB 3: JUDGE ASSIGNMENT */}
          <Tabs.TabPane tab="Phân công Judge" key="3">
            <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
              <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'JUDGE')} initialValues={{ assignment_type: 'NORMAL' }}>
                <Space size="middle" wrap>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn Giám khảo..." style={{ width: 220 }}>
                      {/* Lưu ý: Bạn có thể bỏ comment filter JUDGE bên dưới khi đã test xong conflict */}
                      {people/*.filter(p => p.role === 'JUDGE')*/.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="round_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn Vòng SƠ LOẠI..." style={{ width: 250 }}>
                      {preliminaryRounds.map(r => <Option key={r.id} value={r.id}>{r.name} ({getTrackName(r.track_id)})</Option>)}
                    </Select>
                  </Form.Item>
                  {/* GIỮ VALUE LÀ TIẾNG ANH CHO CHUẨN DB, NHƯNG HIỂN THỊ TIẾNG VIỆT */}
                  <Form.Item name="assignment_type" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select style={{ width: 140 }}>
                      <Option value="NORMAL">Bình thường</Option>
                      <Option value="HEAD">Trưởng ban</Option>
                      <Option value="CALIBRATION">Chấm chéo</Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Phân công</Button>
                </Space>
              </Form>
            </Card>
            <Table dataSource={hackathonAssignments.filter(a => a.type === 'JUDGE')} columns={judgeColumnsAssign} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có Judge nào được phân công' }}/>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* MODAL MỜI GUEST JUDGE */}
      <Modal title="Mời Giám khảo khách mời" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} okText="Gửi lời mời" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleAddGuestJudge}>
          <Form.Item name="name" label="Họ và Tên" rules={[{ required: true, message: 'Bắt buộc nhập' }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input placeholder="VD: email@example.com" /></Form.Item>
          <Form.Item name="institution" label="Đơn vị/Tổ chức"><Input placeholder="Tên công ty hoặc trường đại học" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PeopleManagementPage;