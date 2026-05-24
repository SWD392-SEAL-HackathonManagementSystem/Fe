import React from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Divider,
  theme,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { CRITERIA_TYPES } from "../constants/criteria.constants";

export const CriteriaBatchModal = ({ visible, onCancel, onFinish }) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.items?.length > 0) {
        onFinish(values.items);
        form.resetFields();
      }
    } catch (err) {}
  };

  const preventNegative = (e) => {
    if (e.key === "-" || e.key === "e") e.preventDefault();
  };

  return (
    <Modal
      title="Thêm hàng loạt tiêu chí"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      width={1200}
      destroyOnClose
      style={{ top: 30 }}
      styles={{ content: { borderRadius: 16 } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          items: [
            { type: "TECHNICAL", weight: 0.1, max_score: 10, display_order: 1 },
          ],
        }}
      >
        <Row
          gutter={16}
          style={{
            marginBottom: 12,
            padding: "0 8px",
            color: token.colorTextSecondary,
            fontWeight: 600,
            fontSize: 13,
            textTransform: "uppercase",
          }}
        >
          <Col span={5}>Tên tiêu chí *</Col>
          <Col span={4}>Phân loại *</Col>
          <Col span={3}>Trọng số *</Col>
          <Col span={3}>Điểm tối đa *</Col>
          <Col span={8}>Mô tả *</Col>
          <Col span={1}></Col>
        </Row>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row
                  gutter={16}
                  key={key}
                  style={{ marginBottom: 12 }}
                  align="top"
                >
                  <Col span={5}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Tên tiêu chí..." />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "type"]}
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Phân loại">
                        {CRITERIA_TYPES.map((t) => (
                          <Select.Option key={t} value={t}>
                            {t}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, "weight"]}
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        max={1}
                        step={0.05}
                        onKeyDown={preventNegative}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, "max_score"]}
                      rules={[{ required: true }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        max={100}
                        onKeyDown={preventNegative}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "description"]}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Mô tả..." />
                    </Form.Item>
                  </Col>
                  <Col
                    span={1}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: 4,
                    }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Divider style={{ margin: "16px 0" }} />
              <Button
                type="dashed"
                size="large"
                onClick={() =>
                  add({
                    type: "TECHNICAL",
                    weight: 0.1,
                    max_score: 10,
                    display_order: fields.length + 1,
                  })
                }
                block
                icon={<PlusOutlined />}
                style={{ borderRadius: 8 }}
              >
                Thêm dòng tiêu chí
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
