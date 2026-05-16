import React from 'react';
import { Form, Input, DatePicker, Select, Switch, Row, Col, Space, Button } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const HackathonForm = ({ form, onFinish, initialValues }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        year: new Date().getFullYear(),
        wildcard_enabled: false,
        individual_ranking_enabled: true,
        ...initialValues,
        registration_start: initialValues?.registration_start ? dayjs(initialValues.registration_start) : null,
        registration_end: initialValues?.registration_end ? dayjs(initialValues.registration_end) : null,
        event_start: initialValues?.event_start ? dayjs(initialValues.event_start) : null,
        event_end: initialValues?.event_end ? dayjs(initialValues.event_end) : null,
      }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Form.Item
            name="name"
            label="Tên Hackathon"
            rules={[{ required: true, message: 'Vui lòng nhập tên hackathon' }]}
          >
            <Input placeholder="Ví dụ: SEAL Hackathon Xuân 2026" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="slug"
            label="Đường dẫn (Slug)"
            rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
          >
            <Input placeholder="Ví dụ: seal-xuan-2026" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="season"
            label="Mùa"
            rules={[{ required: true, message: 'Vui lòng chọn mùa' }]}
          >
            <Select placeholder="Chọn mùa">
              <Option value="Spring">Xuân</Option>
              <Option value="Summer">Hạ</Option>
              <Option value="Fall">Thu</Option>
              <Option value="Winter">Đông</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="year"
            label="Năm"
            rules={[{ required: true, message: 'Vui lòng nhập năm' }]}
          >
            <Input type="number" placeholder="Ví dụ: 2026" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Mô tả">
        <TextArea rows={4} placeholder="Mô tả ngắn gọn về hackathon" />
      </Form.Item>

      <Form.Item name="rules" label="Thể lệ">
        <TextArea rows={4} placeholder="Quy định và thể lệ cuộc thi" />
      </Form.Item>

      <Form.Item name="banner_url" label="Link ảnh Banner">
        <Input placeholder="https://example.com/banner.jpg" />
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="registration_start"
            label="Bắt đầu Đăng ký"
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }} 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="registration_end"
            label="Kết thúc Đăng ký"
            dependencies={['registration_start']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('registration_start');
                  if (!value || !start || dayjs(value).isAfter(dayjs(start)) || dayjs(value).isSame(dayjs(start))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày kết thúc đăng ký phải sau hoặc bằng ngày bắt đầu'));
                },
              }),
            ]}
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }} 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="event_start"
            label="Bắt đầu Sự kiện"
            dependencies={['registration_end']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const regEnd = getFieldValue('registration_end');
                  if (!value || !regEnd || dayjs(value).isAfter(dayjs(regEnd)) || dayjs(value).isSame(dayjs(regEnd))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Sự kiện phải bắt đầu sau khi kết thúc đăng ký'));
                },
              }),
            ]}
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }} 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="event_end"
            label="Kết thúc Sự kiện"
            dependencies={['event_start']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('event_start');
                  if (!value || !start || dayjs(value).isAfter(dayjs(start)) || dayjs(value).isSame(dayjs(start))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'));
                },
              }),
            ]}
          >
            <DatePicker 
              showTime 
              style={{ width: '100%' }} 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="wildcard_enabled"
            label="Cho phép Wildcard"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="individual_ranking_enabled"
            label="Bật Bảng xếp hạng cá nhân"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default HackathonForm;
