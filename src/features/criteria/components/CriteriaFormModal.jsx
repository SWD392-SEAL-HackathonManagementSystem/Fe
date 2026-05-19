// CriteriaFormModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const CRITERIA_TYPES = ['TECHNICAL', 'SOFT_SKILL', 'PENALTY'];

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
    } catch (err) {}
  };

  return (
    <Modal title={title} open={visible} onOk={handleOk} onCancel={() => { form.resetFields(); onCancel(); }} destroyOnClose width={560}>
      <Form form={form} layout="vertical" initialValues={{ type: 'TECHNICAL', weight: 0.1, max_score: 10, ...initialValues }}>
        <Form.Item name="name" label="Tên tiêu chí" rules={[{ required: true }]}>
          <Input placeholder="e.g., Kiến trúc RAG, Giao diện UX/UI..." />
        </Form.Item>
        <Form.Item name="type" label="Phân loại" rules={[{ required: true }]}>
          <Select placeholder="Chọn phân loại">
            {CRITERIA_TYPES.map((type) => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="rubric_url" label="Link Rubric">
          <Input placeholder="https://docs.google.com/..." />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="weight" label="Trọng số" rules={[{ required: true }]} style={{ flex: 1 }}>
            <InputNumber min={0.01} max={1} step={0.05} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="max_score" label="Điểm tối đa" rules={[{ required: true }]} style={{ flex: 1 }}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item name="display_order" label="Thứ tự hiển thị">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
          <TextArea rows={3} showCount maxLength={200} placeholder="Mô tả tiêu chí để ban giám khảo đánh giá..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CriteriaFormModal;