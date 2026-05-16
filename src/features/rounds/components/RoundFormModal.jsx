import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Row, Col, Select, DatePicker, Switch, message } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const RoundFormModal = ({ visible, onCancel, onFinish, initialValues, title, tracks }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          submission_open: initialValues.submission_open ? dayjs(initialValues.submission_open) : null,
          submission_deadline: initialValues.submission_deadline ? dayjs(initialValues.submission_deadline) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          submission_open: values.submission_open?.format('YYYY-MM-DD HH:mm:ss'),
          submission_deadline: values.submission_deadline?.format('YYYY-MM-DD HH:mm:ss'),
        };
        onFinish(formattedValues);
        form.resetFields();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      open={visible}
      title={title}
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={handleSubmit}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sequence_order: 1,
          tiebreak_rule: 'PENALTY_SCORE',
          is_active: false,
          wildcard_enabled: false
        }}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Round Name"
              rules={[{ required: true, message: 'Please enter round name' }]}
            >
              <Input placeholder="e.g. Sơ loại" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="sequence_order"
              label="Sequence Order"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="track_id"
          label="Track"
          rules={[{ required: true, message: 'Please select a track' }]}
        >
          <Select placeholder="Select track">
            {tracks.map(t => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="submission_open"
              label="Submission Open"
              dependencies={['submission_deadline']}
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
              name="submission_deadline"
              label="Submission Deadline"
              dependencies={['submission_open']}
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                { required: true, message: 'Required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const open = getFieldValue('submission_open');
                    if (!value || !open || dayjs(value).isAfter(dayjs(open))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Deadline must be after opening time'));
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
              name="coding_duration_hours"
              label="Coding Duration (Hours)"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value === undefined || value === null || value > 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Duration must be > 0'));
                  },
                }),
              ]}
            >
              <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="problem_statement_url"
              label="Problem Statement URL"
            >
              <Input placeholder="https://example.com/problem" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              name="top_n_advance"
              label="Top N Advance"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="min_teams_final"
              label="Min Teams Final"
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="tiebreak_rule"
              label="Tiebreak Rule"
            >
              <Select>
                <Option value="PENALTY_SCORE">Penalty Score</Option>
                <Option value="LATEST_SUBMISSION">Latest Submission</Option>
                <Option value="EARLIEST_SUBMISSION">Earliest Submission</Option>
              </Select>
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
              name="is_active"
              label="Is Active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default RoundFormModal;
