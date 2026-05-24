import React, { useState } from 'react';
import { Card, Button, Table, Form, Input, Modal, Select, Tag, Radio, Badge, Calendar, Space, Spin, Popconfirm, DatePicker, Switch } from 'antd';
import { Plus, List, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { useAppContext } from '../../../app/AppContext';
import { useEventManagement } from '../hooks/useEventManagement';

const { TextArea } = Input;

const EventManagementPage = ({ hackathonId }) => {
  const { addNotification } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [form] = Form.useForm();

  // Gọi API thông qua Custom Hook thay vì dùng Mock Data
  const { events, isLoading, createEvent, deleteEvent } = useEventManagement(hackathonId, addNotification);

  const handleFinish = (values) => {
    createEvent(values, () => {
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const columns = [
    { title: 'Tên sự kiện', dataIndex: 'title', key: 'title', render: text => <strong>{text}</strong> },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: type => <Tag color="purple">{type}</Tag> },
    { title: 'Bắt đầu', dataIndex: 'starts_at', key: 'starts', render: text => dayjs(text).format('YYYY-MM-DD HH:mm') },
    { title: 'Kết thúc', dataIndex: 'ends_at', key: 'ends', render: text => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-' },
    { title: 'Trạng thái', dataIndex: 'is_public', key: 'public', render: (pub) => pub ? <Tag color="green">Mở</Tag> : <Tag>Đóng</Tag> },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Xóa sự kiện"
          description="Bạn có chắc chắn muốn xóa sự kiện này?"
          onConfirm={() => deleteEvent(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  const getBadgeStatus = (type) => {
    switch (type) {
      case 'KICKOFF': return 'error';
      case 'AWARDS': return 'warning';
      case 'PRESENTATION': return 'success';
      default: return 'processing';
    }
  };

  const dateCellRender = (value) => {
    const listData = events.filter(e => dayjs(e.starts_at).isSame(value, 'day'));
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
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
        ) : viewMode === 'list' ? (
          <Table scroll={{ x: 'max-content' }} dataSource={events} columns={columns} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có sự kiện nào được tạo.' }} />
        ) : (
          <Calendar cellRender={cellRender} />
        )}
      </Card>

      <Modal title="Tạo Lịch Sự kiện" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} width={700} okText="Lưu" confirmLoading={isLoading}>
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

          <Form.Item 
            name="location" 
            label="Địa điểm (Offline)"
            dependencies={['meet_url']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value || getFieldValue('meet_url')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Bắt buộc nhập Địa điểm HOẶC Link họp'));
                },
              }),
            ]}
          >
            <Input placeholder="VD: Tòa nhà Beta" />
          </Form.Item>

          <Form.Item 
            name="meet_url" 
            label="Link Họp (Online)"
            dependencies={['location']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value || getFieldValue('location')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Bắt buộc nhập Địa điểm HOẶC Link họp'));
                },
              }),
            ]}
          >
            <Input placeholder="https://meet.google.com/..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả"><TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventManagementPage;