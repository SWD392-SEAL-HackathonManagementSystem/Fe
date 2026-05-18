import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { CRITERIA_TYPES } from '../data/criteria.mock';

const { TextArea } = Input;
const { Option } = Select;

const CriteriaFormModal = ({ visible, title, initialValues, onCancel, onFinish }) => {
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

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onFinish(values);
      form.resetFields();
    } catch (err) {
      // Validation failed
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText={initialValues ? 'Update' : 'Create'}
      cancelText="Cancel"
      destroyOnClose
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'General',
          weight: 0.1,
          max_score: 100,
          ...initialValues,
        }}
      >
        <Form.Item
          name="name"
          label="Criteria Name"
          rules={[{ required: true, message: 'Please enter criteria name' }]}
        >
          <Input placeholder="e.g., Code Quality, Innovation..." />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Please select a type' }]}
        >
          <Select placeholder="Select type">
            {CRITERIA_TYPES.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="rubric_url"
          label="Rubric URL"
          rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
        >
          <Input placeholder="https://example.com/rubric" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="weight"
            label="Weight"
            rules={[
              { required: true, message: 'Please enter weight' },
              {
                type: 'number',
                min: 0.01,
                max: 1,
                message: 'Weight must be between 0.01 and 1.0',
              },
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              min={0.01}
              max={1}
              step={0.05}
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="max_score"
            label="Max Score"
            rules={[
              { required: true, message: 'Please enter max score' },
              {
                type: 'number',
                min: 1,
                max: 1000,
                message: 'Max score must be between 1 and 1000',
              },
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              min={1}
              max={1000}
              step={10}
              placeholder="100"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="display_order"
            label="Display Order"
            style={{ flex: 1 }}
          >
            <InputNumber
              min={1}
              placeholder="1"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <div style={{ flex: 1 }}></div>
        </div>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            rows={3}
            placeholder="Describe what this criteria evaluates..."
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CriteriaFormModal;
