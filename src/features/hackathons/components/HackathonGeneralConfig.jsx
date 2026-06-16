import React, { useState } from 'react';
import { Alert, Button, Form, Input, Space, Typography, message } from 'antd';
import { hackathonService } from '../services/hackathonService';
import { mapHackathonToBE } from '../mappers/hackathonMapper';

const { Text } = Typography;

const HackathonGeneralConfig = ({ hackathon, onUpdated }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isDraft = hackathon?.status === 'DRAFT';

  React.useEffect(() => {
    if (hackathon) {
      form.setFieldsValue({
        max_participants: hackathon.max_participants ?? hackathon.maxParticipants,
      });
    }
  }, [hackathon, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = mapHackathonToBE({ ...hackathon, max_participants: values.max_participants });
      await hackathonService.update(hackathon.id, payload);
      message.success('Đã cập nhật cấu hình chung');
      onUpdated?.();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || 'Không thể cập nhật hackathon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Cấu hình chung
      </Typography.Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Thiết lập giới hạn đăng ký và các thông số cơ bản của giải đấu.
      </Text>

      {!isDraft && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message="Chỉ chỉnh sửa khi Hackathon ở trạng thái DRAFT"
          description="Hackathon đang ở trạng thái khác DRAFT — số lượng người tham gia tối đa chỉ xem, không thể lưu qua API."
        />
      )}

      <Form form={form} layout="vertical" style={{ maxWidth: 420 }}>
        <Form.Item
          name="max_participants"
          label="Số lượng người tham gia tối đa"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng người tham gia tối đa' },
            {
              validator: (_, value) => {
                const num = Number(value);
                if (!value || Number.isNaN(num) || num < 1) {
                  return Promise.reject(new Error('Giá trị phải là số nguyên dương, tối thiểu 1'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input type="number" min={1} disabled={!isDraft} placeholder="Ví dụ: 100" />
        </Form.Item>

        {isDraft && (
          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              Lưu cấu hình
            </Button>
          </Space>
        )}
      </Form>
    </div>
  );
};

export default HackathonGeneralConfig;
