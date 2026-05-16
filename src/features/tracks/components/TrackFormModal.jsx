import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Row, Col, Select, message } from 'antd';

const { TextArea } = Input;

const TrackFormModal = ({ visible, onCancel, onFinish, initialValues, title }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onFinish(values);
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
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          min_team_size: 1,
          max_team_size: 5,
          status: 'OPEN'
        }}
      >
        <Form.Item
          name="name"
          label="Track Name"
          rules={[{ required: true, message: 'Please enter track name' }]}
        >
          <Input placeholder="e.g. Web Development" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Briefly describe the track" />
        </Form.Item>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="max_teams"
              label="Max Teams"
              dependencies={['max_teams_per_group']}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_teams_per_group"
              label="Max Teams Per Group"
              dependencies={['max_teams']}
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const maxTeams = getFieldValue('max_teams');
                    if (!value || !maxTeams || value <= maxTeams) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Max teams per group must be ≤ total max teams'));
                  },
                }),
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="min_team_size"
              label="Min Team Size"
              rules={[{ required: true, message: 'Required' }]}
              dependencies={['max_team_size']}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_team_size"
              label="Max Team Size"
              dependencies={['min_team_size']}
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                { required: true, message: 'Required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const minSize = getFieldValue('min_team_size');
                    if (!value || !minSize || value >= minSize) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Max size must be ≥ min size'));
                  },
                }),
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="Status">
          <Select>
            <Select.Option value="OPEN">Open</Select.Option>
            <Select.Option value="CLOSED">Closed</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TrackFormModal;
