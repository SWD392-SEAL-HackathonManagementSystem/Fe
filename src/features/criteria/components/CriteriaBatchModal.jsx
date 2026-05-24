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
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { Option } = Select;
const CRITERIA_TYPES = ["TECHNICAL", "SOFT_SKILL", "PENALTY"];

export const CriteriaBatchModal = ({ visible, onCancel, onFinish }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (values.items && values.items.length > 0) {
        onFinish(values.items);
        form.resetFields();
      }
    } catch (err) {}
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
      width={1100}
      destroyOnClose
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
        <Row gutter={8} style={{ marginBottom: 8, fontWeight: "bold" }}>
          <Col span={5}>
            Tên tiêu chí <span style={{ color: "red" }}>*</span>
          </Col>
          <Col span={4}>
            Phân loại <span style={{ color: "red" }}>*</span>
          </Col>
          <Col span={3}>
            Trọng số <span style={{ color: "red" }}>*</span>
          </Col>
          <Col span={3}>
            Điểm tối đa <span style={{ color: "red" }}>*</span>
          </Col>
          <Col span={8}>
            Mô tả <span style={{ color: "red" }}>*</span>
          </Col>
          <Col span={1}></Col>
        </Row>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row
                  gutter={8}
                  key={key}
                  style={{ marginBottom: 16 }}
                  align="top"
                >
                  <Col span={5}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Nhập tên" }]}
                    >
                      <Input placeholder="Nhập tên tiêu chí..." />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, "type"]}
                      rules={[{ required: true, message: "Chọn loại" }]}
                    >
                      <Select placeholder="Phân loại">
                        {CRITERIA_TYPES.map((t) => (
                          <Option key={t} value={t}>
                            {t}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, "weight"]}
                      rules={[{ required: true, message: "Nhập TS" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0.01}
                        max={1}
                        step={0.05}
                        placeholder="Trọng số"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, "max_score"]}
                      rules={[{ required: true, message: "Nhập Max" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={1}
                        max={100}
                        placeholder="Điểm max"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "description"]}
                      rules={[{ required: true, message: "Nhập mô tả" }]}
                    >
                      <Input placeholder="Mô tả chi tiết..." />
                    </Form.Item>
                  </Col>
                  <Col
                    span={1}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "32px",
                    }}
                  >
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{
                        color: "#ff4d4f",
                        fontSize: "18px",
                        cursor: "pointer",
                      }}
                    />
                  </Col>
                </Row>
              ))}
              <Divider style={{ margin: "12px 0" }} />
              <Form.Item>
                <Button
                  type="dashed"
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
                >
                  Thêm một dòng tiêu chí mới
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
