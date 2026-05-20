import React, { useState } from 'react';
import { Card, Tabs, Button, Table, Form, Input, Modal, Select, Tag, message, notification, Space } from 'antd';
import { UserPlus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../../app/AppContext';

const { Option } = Select;

const PeopleManagementPage = ({ hackathonId }) => {
  const { people, addPerson, assignments, assignRole, removeAssignment, tracks, rounds, addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const hackathonTracks = tracks.filter(t => t.hackathon_id === hackathonId);
  const hackathonRounds = rounds.filter(r => hackathonTracks.map(t => t.id).includes(r.track_id));
  const hackathonAssignments = assignments.filter(a => a.hackathon_id === hackathonId);

  const preliminaryRounds = hackathonRounds.filter(r => r.sequence_order === 1);

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

  const checkIsFinalRound = (round) => {
    if (!round) return false;
    return round.sequence_order > 1 || round.name.toLowerCase().includes('chung kết') || round.name.toLowerCase().includes('final');
  };

  const handleAssign = (values, type) => {
    const isExist = hackathonAssignments.some(a => 
      a.person_id === values.person_id && 
      a.type === type && 
      (a.track_id === values.track_id || a.round_id === values.round_id)
    );
    if (isExist) return message.error('Nhân sự này đã được phân công vào hạng mục này rồi!');

    if (type === 'JUDGE') {
      const targetRound = hackathonRounds.find(r => r.id === values.round_id);
      const targetTrackId = targetRound?.track_id;
      
      const isFinalRound = checkIsFinalRound(targetRound); 
      
      const isMentorSameTrack = hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id && a.track_id === targetTrackId);
      const isMentorAnywhere = hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id);

      if (isMentorSameTrack) {
        return message.error('Lỗi: Mentor không được làm Giám khảo cho chính Bảng đấu (Track) mà mình hướng dẫn!');
      }

      if (values.assignment_type === 'HEAD' && isMentorAnywhere) {
        return message.error('Lỗi: Người đã từng làm Mentor tuyệt đối không được giữ vai trò Trưởng ban!');
      }

      if (isFinalRound && isMentorAnywhere) {
        return message.error('Lỗi: Người đã tham gia làm Mentor không được phép chấm thi tại Vòng Chung kết!');
      }
    }

    if (type === 'MENTOR') {
      const isJudgeSameTrack = hackathonAssignments.some(a => {
        if (a.type !== 'JUDGE') return false;
        const roundOfJudge = hackathonRounds.find(r => r.id === a.round_id);
        return roundOfJudge?.track_id === values.track_id && a.person_id === values.person_id;
      });

      if (isJudgeSameTrack) {
        return message.error('Lỗi: Người này đang làm Giám khảo cho Bảng đấu này, không thể phân công làm Mentor!');
      }

      const isHeadJudge = hackathonAssignments.some(a => a.type === 'JUDGE' && a.assignment_type === 'HEAD' && a.person_id === values.person_id);
      if (isHeadJudge) {
        return message.error('Lỗi: Người này đang giữ vai trò Trưởng ban, không thể phân công đi làm Mentor!');
      }

      const isJudgeFinalRound = hackathonAssignments.some(a => {
        if (a.type !== 'JUDGE') return false;
        const roundOfJudge = hackathonRounds.find(r => r.id === a.round_id);
        return checkIsFinalRound(roundOfJudge) && a.person_id === values.person_id;
      });

      if (isJudgeFinalRound) {
        return message.error('Lỗi: Người này đang là Giám khảo Vòng Chung kết, không thể phân công đi làm Mentor!');
      }
    }

    assignRole({ ...values, hackathon_id: hackathonId, type });
    message.success(`Đã phân công ${type === 'MENTOR' ? 'Mentor' : 'Giám khảo'} thành công!`);
  };

  const getPersonName = (id) => people.find(p => p.id === id)?.name || 'Không xác định';
  const getTrackName = (id) => tracks.find(t => t.id === id)?.name || 'Không xác định';
  const getRoundName = (id) => rounds.find(r => r.id === id)?.name || 'Không xác định';

  const renderInvitationStatus = (status) => {
    switch (status) {
      case 'ACCEPTED': return <Tag color="green">Đã chấp nhận</Tag>;
      case 'PENDING': return <Tag color="orange">Chờ phản hồi</Tag>;
      case 'SENT': return <Tag color="blue">Đã gửi</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const renderJudgeRole = (role) => {
    switch (role) {
      case 'HEAD': return <Tag color="red">Trưởng ban</Tag>;
      case 'CALIBRATION': return <Tag color="gold">Chấm chéo</Tag>;
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
      <Card>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Giám khảo khách mời" key="1">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsModalOpen(true)}>
                Mời Giám khảo (Tạo tài khoản tạm thời)
              </Button>
            </div>
            <Table 
              scroll={{ x: 'max-content' }}
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

          <Tabs.TabPane tab="Phân công người hướng dẫn" key="2">
            <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
              <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'MENTOR')}>
                <Space size="middle" wrap>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn người hướng dẫn" style={{ width: 220 }}>
                      {people.filter(p => p.role === 'MENTOR').map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="track_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn bảng đấu" style={{ width: 250 }}>
                      {hackathonTracks.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Phân công</Button>
                </Space>
              </Form>
            </Card>
            <Table 
              scroll={{ x: 'max-content' }}
              dataSource={hackathonAssignments.filter(a => a.type === 'MENTOR')} 
              columns={mentorColumns} 
              rowKey="id" 
              pagination={false} 
              locale={{ emptyText: 'Chưa có người hướng dẫn nào được phân công' }} 
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Phân công giám khảo" key="3">
            <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
              <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'JUDGE')} initialValues={{ assignment_type: 'NORMAL' }}>
                <Space size="middle" wrap>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn giám khảo" style={{ width: 220 }}>
                      {people.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="round_id" rules={[{ required: true, message: 'Vui lòng chọn' }]}>
                    <Select placeholder="Chọn vòng thi" style={{ width: 250 }}>
                      {hackathonRounds.map(r => <Option key={r.id} value={r.id}>{r.name} ({getTrackName(r.track_id)})</Option>)}
                    </Select>
                  </Form.Item>
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
            <Table 
              scroll={{ x: 'max-content' }}
              dataSource={hackathonAssignments.filter(a => a.type === 'JUDGE')} 
              columns={judgeColumnsAssign} 
              rowKey="id" 
              pagination={false} 
              locale={{ emptyText: 'Chưa có Giám khảo nào được phân công' }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

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