import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Table, Form, Input, Modal, Select, Tag, message, notification, Space, Spin } from 'antd';
import { UserPlus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../../app/AppContext';
import { trackService } from '../../tracks/services/trackService';
import { roundService } from '../../rounds/services/roundService';

const { Option } = Select;

const PeopleManagementPage = ({ hackathonId }) => {
  const { people, addPerson, assignments, assignRole, removeAssignment, addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Khởi tạo 3 form độc lập để không bị xung đột (đơ nút)
  const [inviteForm] = Form.useForm();
  const [mentorForm] = Form.useForm();
  const [judgeForm] = Form.useForm();
  
  const [tracks, setTracks] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tRes, rRes] = await Promise.all([
          trackService.listByHackathon(hackathonId),
          roundService.listByHackathon(hackathonId)
        ]);
        setTracks(tRes || []);
        setRounds(rRes || []);
      } catch (err) {
        message.error('Không thể tải dữ liệu Bảng đấu/Vòng thi từ Server');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hackathonId]);

  const hackathonAssignments = assignments.filter(a => a.hackathon_id === hackathonId);

  const handleAddGuestJudge = (values) => {
    addPerson({ ...values, role: 'JUDGE' });
    message.success('Đã tạo tài khoản và gửi lời mời thành công');
    setIsModalOpen(false);
    inviteForm.resetFields(); // Reset form sau khi mời
    addNotification({ type: 'INVITATION', title: 'Đã gửi lời mời', description: `Mời ${values.name} (${values.email}).` });
  };

  const checkIsFinalRound = (round) => {
    if (!round) return false;
    // Đã gộp code của nhánh main (thêm !! để an toàn kiểu dữ liệu)
    return !!round.is_final || round.name.toLowerCase().includes('chung kết') || round.name.toLowerCase().includes('final');
  };

  const handleAssign = (values, type, formInstance) => {
    let assignTrackId = values.track_id;
    let assignRoundId = values.round_id;

    if (type === 'JUDGE') {
      const [targetType, targetId] = values.assignment_target.split('_');
      if (targetType === 'TRACK') assignTrackId = parseInt(targetId);
      if (targetType === 'ROUND') assignRoundId = parseInt(targetId);
    }

    const isExist = hackathonAssignments.some(a => 
      a.person_id === values.person_id && a.type === type && 
      ((assignTrackId && a.track_id === assignTrackId) || (assignRoundId && a.round_id === assignRoundId))
    );
    if (isExist) return message.error('Nhân sự đã được phân công vào hạng mục này!');

    const isMentorAnywhere = hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id);

    if (type === 'JUDGE') {
      if (assignTrackId) {
        const isMentorSameTrack = hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id && a.track_id === assignTrackId);
        if (isMentorSameTrack) return message.error('Lỗi: Mentor không được chấm chính Bảng đấu mình hướng dẫn!');
      }
      if (assignRoundId && isMentorAnywhere) {
        return message.error('Lỗi: Người đã tham gia làm Mentor không được phép chấm thi tại Vòng Chung kết!');
      }
      if (values.assignment_type === 'HEAD' && isMentorAnywhere) {
        return message.error('Lỗi: Người đã từng làm Mentor tuyệt đối không được giữ vai trò Trưởng ban!');
      }
    }

    if (type === 'MENTOR') {
      const isHeadJudge = hackathonAssignments.some(a => a.type === 'JUDGE' && a.assignment_type === 'HEAD' && a.person_id === values.person_id);
      if (isHeadJudge) return message.error('Lỗi: Người này đang là Trưởng ban, không thể đi làm Mentor!');

      const isJudgeSameTrack = hackathonAssignments.some(a => a.type === 'JUDGE' && a.track_id === assignTrackId && a.person_id === values.person_id);
      if (isJudgeSameTrack) return message.error('Lỗi: Người này đang làm Giám khảo cho Bảng đấu này, không thể làm Mentor!');

      const isJudgeFinalRound = hackathonAssignments.some(a => a.type === 'JUDGE' && a.round_id && a.person_id === values.person_id);
      if (isJudgeFinalRound) return message.error('Lỗi: Đang là Giám khảo Vòng Chung kết, không thể làm Mentor!');
    }

    assignRole({ 
      ...values, 
      track_id: assignTrackId, 
      round_id: assignRoundId, 
      hackathon_id: hackathonId, 
      type 
    });
    
    message.success(`Phân công ${type === 'MENTOR' ? 'Mentor' : 'Giám khảo'} thành công!`);
    formInstance.resetFields(); // Làm sạch ô nhập liệu để sẵn sàng chọn người tiếp theo
  };

  const getPersonName = (id) => people.find(p => p.id === id)?.name || 'Không xác định';
  const getTrackName = (id) => tracks.find(t => t.id === id)?.name || 'Không xác định';
  const getRoundName = (id) => rounds.find(r => r.id === id)?.name || 'Không xác định';

  const renderJudgeRole = (role) => {
    switch (role) {
      case 'HEAD': return <Tag color="red">Trưởng ban</Tag>;
      case 'CALIBRATION': return <Tag color="gold">Chấm chéo</Tag>;
      case 'NORMAL': return <Tag color="blue">Bình thường</Tag>;
      default: return <Tag color="blue">Bình thường</Tag>;
    }
  };

  if (loading) return <Card><Spin /></Card>;

  return (
    <div>
      <Card>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Giám khảo khách mời" key="1">
             <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
               <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setIsModalOpen(true)}>Mời Giám khảo</Button>
             </div>
             <Table dataSource={people.filter(p => p.role === 'JUDGE')} rowKey="id" pagination={false} columns={[
                { title: 'Tên', dataIndex: 'name', key: 'name', render: t => <strong>{t}</strong> },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Tổ chức', dataIndex: 'institution', key: 'institution' }
             ]} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Phân công người hướng dẫn" key="2">
             <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
               <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'MENTOR', mentorForm)} form={mentorForm}>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Chọn Mentor' }]}>
                    <Select placeholder="Chọn người hướng dẫn" style={{ width: 220 }}>
                        {people.filter(p => p.role === 'MENTOR').map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="track_id" rules={[{ required: true, message: 'Chọn Bảng đấu' }]}>
                    <Select placeholder="Chọn bảng đấu" style={{ width: 250 }}>
                        {tracks.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Phân công</Button>
               </Form>
             </Card>
             <Table dataSource={hackathonAssignments.filter(a => a.type === 'MENTOR')} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có Mentor nào được phân công' }} columns={[
                { title: 'Tên Mentor', render: (_, r) => <strong>{getPersonName(r.person_id)}</strong> },
                { title: 'Phụ trách Bảng đấu', render: (_, r) => <Tag color="blue">{getTrackName(r.track_id)}</Tag> },
                { title: 'Thao tác', render: (_, r) => <Button type="text" danger icon={<Trash2 size={16}/>} onClick={() => removeAssignment(r.id)} /> }
             ]} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Phân công giám khảo" key="3">
             <Card type="inner" style={{ marginBottom: 24, background: '#fafafa' }}>
               <Form layout="inline" onFinish={(vals) => handleAssign(vals, 'JUDGE', judgeForm)} form={judgeForm} initialValues={{ assignment_type: 'NORMAL' }}>
                  <Form.Item name="person_id" rules={[{ required: true, message: 'Chọn Giám Khảo' }]}>
                    <Select placeholder="Chọn giám khảo" style={{ width: 220 }}>
                        {people.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item name="assignment_target" rules={[{ required: true, message: 'Chọn hạng mục chấm' }]}>
                    <Select placeholder="Chọn Bảng đấu / Vòng thi" style={{ width: 280 }}>
                        <Select.OptGroup label="Chấm Sơ loại (Theo Bảng đấu)">
                            {tracks.map(t => (
                                <Option key={`TRACK_${t.id}`} value={`TRACK_${t.id}`}>{t.name}</Option>
                            ))}
                        </Select.OptGroup>
                        <Select.OptGroup label="Chấm Chung kết (Toàn Vòng)">
                            {rounds.filter(checkIsFinalRound).map(r => (
                                <Option key={`ROUND_${r.id}`} value={`ROUND_${r.id}`}>{r.name} (Vòng Chung kết)</Option>
                            ))}
                        </Select.OptGroup>
                    </Select>
                  </Form.Item>
                  <Form.Item name="assignment_type">
                    <Select style={{ width: 140 }}>
                        <Option value="NORMAL">Bình thường</Option>
                        <Option value="HEAD">Trưởng ban</Option>
                        <Option value="CALIBRATION">Chấm chéo</Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Phân công</Button>
               </Form>
             </Card>
             <Table dataSource={hackathonAssignments.filter(a => a.type === 'JUDGE')} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có Giám khảo nào được phân công' }} columns={[
                { title: 'Tên Giám khảo', render: (_, r) => <strong>{getPersonName(r.person_id)}</strong> },
                { title: 'Hạng mục chấm', render: (_, r) => r.track_id ? <Tag color="blue">{getTrackName(r.track_id)}</Tag> : <Tag color="geekblue">{getRoundName(r.round_id)}</Tag> },
                { title: 'Vai trò', dataIndex: 'assignment_type', render: t => renderJudgeRole(t) },
                { title: 'Thao tác', render: (_, r) => <Button type="text" danger icon={<Trash2 size={16}/>} onClick={() => removeAssignment(r.id)} /> }
             ]} />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal title="Mời Giám khảo khách mời" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => inviteForm.submit()} okText="Gửi lời mời">
         <Form form={inviteForm} layout="vertical" onFinish={handleAddGuestJudge}>
            <Form.Item name="name" label="Họ và Tên" rules={[{ required: true, message: 'Bắt buộc nhập' }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input placeholder="VD: email@example.com" /></Form.Item>
            <Form.Item name="institution" label="Đơn vị/Tổ chức"><Input placeholder="Tên công ty hoặc trường đại học" /></Form.Item>
         </Form>
      </Modal>
    </div>
  );
};

export default PeopleManagementPage;