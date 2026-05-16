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
            label="Hackathon Name"
            rules={[{ required: true, message: 'Please enter hackathon name' }]}
          >
            <Input placeholder="e.g. SEAL Hackathon Spring 2026" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Please enter slug' }]}
          >
            <Input placeholder="e.g. seal-spring-2026" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="season"
            label="Season"
            rules={[{ required: true, message: 'Please select season' }]}
          >
            <Select placeholder="Select season">
              <Option value="Spring">Spring</Option>
              <Option value="Summer">Summer</Option>
              <Option value="Fall">Fall</Option>
              <Option value="Winter">Winter</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Please enter year' }]}
          >
            <Input type="number" placeholder="e.g. 2026" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Description">
        <TextArea rows={4} placeholder="Briefly describe the hackathon" />
      </Form.Item>

      <Form.Item name="rules" label="Rules">
        <TextArea rows={4} placeholder="Specify rules and regulations" />
      </Form.Item>

      <Form.Item name="banner_url" label="Banner URL">
        <Input placeholder="https://example.com/banner.jpg" />
      </Form.Item>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="registration_start"
            label="Registration Start"
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
            label="Registration End"
            dependencies={['registration_start']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('registration_start');
                  if (!value || !start || dayjs(value).isAfter(dayjs(start)) || dayjs(value).isSame(dayjs(start))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Registration end must be after or equal to start'));
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
            label="Event Start"
            dependencies={['registration_end']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const regEnd = getFieldValue('registration_end');
                  if (!value || !regEnd || dayjs(value).isAfter(dayjs(regEnd)) || dayjs(value).isSame(dayjs(regEnd))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Event start must be after or equal to registration end'));
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
            label="Event End"
            dependencies={['event_start']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('event_start');
                  if (!value || !start || dayjs(value).isAfter(dayjs(start)) || dayjs(value).isSame(dayjs(start))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Event end must be after or equal to start'));
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
            label="Wildcard Enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="individual_ranking_enabled"
            label="Individual Ranking Enabled"
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
