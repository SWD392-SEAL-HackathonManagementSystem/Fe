import React, { useState } from 'react';
import { Card, Button, Table, Tag, Modal, Form, Input, DatePicker, Select, Switch, message, notification, Calendar, Badge, Radio } from 'antd';
import { Plus, List, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppContext } from '../../../app/AppContext';

const { TextArea } = Input;

const EventManagementPage = ({ hackathonId }) => {
  const { events, addEvent, hackathons, addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [form] = Form.useForm();
  
  const currentHackathon = hackathons.find(h => h.id === hackathonId);
  const hackathonEvents = events.filter(e => e.hackathon_id === hackathonId);

  // MOCK NOTIFICATION 
  const openNotification = (title, desc) => {
    notification.info({
      message: <strong>{title}</strong>,
      description: desc,
      placement: 'bottomRight',
      duration: 5,
    });
  };

  const handleFinish = (values) => {
    const eStart = dayjs(values.starts_at);
    const eEnd = values.ends_at ? dayjs(values.ends_at) : null;
    const hStart = currentHackathon?.event_start ? dayjs(currentHackathon.event_start) : null;
    const hEnd = currentHackathon?.event_end ? dayjs(currentHackathon.event_end).add(1, 'day') : null;
    const rStart = currentHackathon?.registration_start ? dayjs(currentHackathon.registration_start) : hStart;

    // --- LỚP 1: Chặn cứng (Nằm ngoài khung giải đấu) ---
    if (hStart && hEnd) {
      const minStartTime = values.type === 'WORKSHOP' ? rStart : hStart;
      if (eStart.isBefore(minStartTime) || (eEnd && eEnd.isAfter(hEnd))) {
        return message.error(`Lỗi Lớp 1: Thời gian không hợp lệ. ${values.type === 'WORKSHOP' ? 'Workshop phải nằm trong hoặc sau thời gian đăng ký' : 'Sự kiện phải nằm trong thời gian giải đấu'}.`);
      }
    }

    // --- LỚP 2: Chặn cứng (Chồng lấn KICKOFF hoặc AWARDS) ---
    const isOverlap = hackathonEvents.some(e => {
      if ((values.type === 'KICKOFF' && e.type === 'KICKOFF') || (values.type === 'AWARDS' && e.type === 'AWARDS')) {
        const existStart = dayjs(e.starts_at);
        const existEnd = e.ends_at ? dayjs(e.ends_at) : existStart.add(1, 'hour');
        return eStart.isBefore(existEnd) && (eEnd ? eEnd.isAfter(existStart) : eStart.isAfter(existStart));
      }
      return false;
    });

    if (isOverlap) {
      return message.error(`Lỗi Lớp 2: Đã có sự kiện ${values.type} trong khoảng thời gian này!`);
    }

    // --- LỚP 3: Logic tùy chỉnh theo yêu cầu mới ---
    const kickoffEvent = hackathonEvents.find(e => e.type === 'KICKOFF');
    const kickoffStart = kickoffEvent ? dayjs(kickoffEvent.starts_at) : hStart;
    const regEnd = currentHackathon?.registration_end ? dayjs(currentHackathon.registration_end) : null;

    // 🔴 CHẶN CỨNG ĐỐI VỚI WORKSHOP 
    if (values.type === 'WORKSHOP') {
      if (regEnd && eStart.isBefore(regEnd)) {
        return message.error('WORKSHOP training nên diễn ra sau ngày đóng đăng ký.');
      }
      if (kickoffStart && eStart.isAfter(kickoffStart)) {
        return message.error('WORKSHOP training nên diễn ra trước ngày Khai mạc (Kick-off).');
      }
    }

    // 🟡 CẢNH BÁO MỀM (Chỉ còn áp dụng cho KICKOFF nếu diễn ra quá muộn)
    let warningMsg = '';
    if (values.type === 'KICKOFF' && hStart && eStart.isAfter(hStart.add(1, 'day'))) {
      warningMsg = 'KICKOFF nên nằm trong ngày đầu tiên của sự kiện.';
    }

    const saveEvent = () => {
      const formattedValues = {
        ...values,
        starts_at: values.starts_at?.format('YYYY-MM-DD HH:mm'),
        ends_at: values.ends_at?.format('YYYY-MM-DD HH:mm'),
      };
      addEvent({ ...formattedValues, hackathon_id: hackathonId });
      message.success('Đã tạo lịch sự kiện thành công');
      setIsModalOpen(false);
      
      addNotification({
        type: 'REMINDER',
        title: 'Reminder Created',
        description: `Hệ thống đã tự động lên lịch nhắc nhở cho sự kiện: ${values.title}`
      });
      
      notification.info({
        message: <strong>Reminder Scheduled</strong>,
        description: `Hệ thống đã tự động lên lịch nhắc nhở (type=REMINDER) cho sự kiện: ${values.title}`,
        placement: 'bottomRight',
      });
    };

    if (warningMsg) {
      Modal.confirm({
        title: 'Cảnh báo (Thứ tự Logic)',
        content: `${warningMsg} Bạn có chắc chắn muốn bỏ qua cảnh báo và lưu không?`,
        onOk: saveEvent
      });
    } else {
      saveEvent();
    }
  };

  const columns = [
    { title: 'Tên sự kiện', dataIndex: 'title', key: 'title', render: text => <strong>{text}</strong> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: type => <Tag color="purple">{type}</Tag> },
    { title: 'Bắt đầu', dataIndex: 'starts_at', key: 'starts' },
    { title: 'Kết thúc', dataIndex: 'ends_at', key: 'ends' },
    { title: 'Public', dataIndex: 'is_public', key: 'public', render: (pub) => pub ? <Tag color="green">Public</Tag> : <Tag>Private</Tag> },
  ];

  // LOGIC RENDER CALENDAR CELL
  const getBadgeStatus = (type) => {
    switch (type) {
      case 'KICKOFF': return 'error';
      case 'AWARDS': return 'warning';
      case 'PRESENTATION': return 'success';
      default: return 'processing';
    }
  };

  const dateCellRender = (value) => {
    const listData = hackathonEvents.filter(e => dayjs(e.starts_at).isSame(value, 'day'));
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item) => (
          <li key={item.id} style={{ marginBottom: 4 }}>
            <Badge status={getBadgeStatus(item.type)} text={<span style={{ fontSize: 12 }}>{item.title}</span>} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
          <Radio.Button value="list"><List size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Danh sách</Radio.Button>
          <Radio.Button value="calendar"><CalendarIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Lịch sự kiện</Radio.Button>
        </Radio.Group>

        <Button type="primary" icon={<Plus size={16} />} onClick={() => { form.resetFields(); setIsModalOpen(true); }}>
          Tạo Sự kiện
        </Button>
      </div>

      <Card styles={{ body: { padding: viewMode === 'calendar' ? 0 : 24 } }}>
        {viewMode === 'list' ? (
          <Table scroll={{ x: 'max-content' }} dataSource={hackathonEvents} columns={columns} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có sự kiện nào được tạo.' }} />
        ) : (
          <Calendar cellRender={cellRender} />
        )}
      </Card>

      <Modal title="Tạo Lịch Sự kiện" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} width={700} okText="Lưu">
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ is_public: true }}>
          <Form.Item name="title" label="Tiêu đề Sự kiện" rules={[{ required: true }]}><Input placeholder="VD: Lễ Trao giải Hackathon" /></Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="type" label="Phân loại (Type)" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select placeholder="Chọn loại sự kiện">
                <Select.Option value="KICKOFF">KICKOFF (Khai mạc)</Select.Option>
                <Select.Option value="WORKSHOP">WORKSHOP</Select.Option>
                <Select.Option value="PRESENTATION">PRESENTATION (Thuyết trình)</Select.Option>
                <Select.Option value="AWARDS">AWARDS (Trao giải)</Select.Option>
                <Select.Option value="OTHER">OTHER (Khác)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="is_public" label="Hiển thị Public" valuePropName="checked" style={{ flex: 1 }}><Switch /></Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="starts_at" label="Thời gian Bắt đầu" style={{ flex: 1 }} rules={[{ required: true }]}>
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item 
              name="ends_at" label="Thời gian Kết thúc" style={{ flex: 1 }} dependencies={['starts_at']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('starts_at');
                    if (!value || !start || dayjs(value).isAfter(dayjs(start))) return Promise.resolve();
                    return Promise.reject(new Error('Kết thúc phải diễn ra sau lúc bắt đầu'));
                  },
                }),
              ]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="location" label="Địa điểm (Offline)"><Input placeholder="VD: Tòa nhà Beta" /></Form.Item>
          <Form.Item name="meet_url" label="Link Họp (Online)"><Input placeholder="https://meet.google.com/..." /></Form.Item>
          <Form.Item name="description" label="Mô tả"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventManagementPage;