import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Tag, Space, Alert, Row, Col, Spin, Upload } from 'antd';
import {
  CloudUploadOutlined,
  LockOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  LinkOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useFinalSubmission } from '../hooks/useFinalSubmission';
import { criteriaService } from '../../../../features/criteria/services/criteriaService';

const { Title, Text, Paragraph } = Typography;

const formatWeight = (weight) => {
  const value = Number(weight);
  if (Number.isNaN(value)) return '—';
  return value <= 1 ? `${(value * 100).toFixed(0)}%` : `${value}%`;
};

const FinalSubmissionPanel = ({ teamId, hackathonId }) => {
  const [form] = Form.useForm();
  const [slideFile, setSlideFile] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  const {
    finalRound,
    existingSubmission,
    isEligible,
    isFinalRoundActive,
    isAdvanced,
    isLocked,
    timeLeft,
    isSubmitting,
    isLoading,
    submitFinalWork,
  } = useFinalSubmission(teamId, hackathonId);

  useEffect(() => {
    if (!finalRound?.id || !isEligible) {
      setCriteria([]);
      return;
    }

    let cancelled = false;
    setCriteriaLoading(true);
    criteriaService
      .listByFinalRound(finalRound.id)
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];
        setCriteria(items);
      })
      .catch(() => {
        if (!cancelled) setCriteria([]);
      })
      .finally(() => {
        if (!cancelled) setCriteriaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [finalRound?.id, isEligible]);

  if (isLoading) {
    return (
      <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
        <Spin tip="Đang kiểm tra dữ liệu Vòng Chung kết..." />
      </Card>
    );
  }

  if (!finalRound) {
    return null;
  }

  if (!isAdvanced) {
    return (
      <Card style={{ borderRadius: 16, border: '1px solid #ffccc7', background: '#fff2f0' }}>
        <Space align="center">
          <LockOutlined style={{ fontSize: 24, color: '#cf1322' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#cf1322' }}>
              Cổng nộp bài Chung kết
            </Title>
            <Text style={{ color: '#cf1322' }}>
              Đội của bạn chưa đủ điều kiện tham gia Vòng Chung kết hoặc đã dừng bước tại Vòng Sơ loại.
            </Text>
          </div>
        </Space>
      </Card>
    );
  }

  if (!isFinalRoundActive) {
    return (
      <Card style={{ borderRadius: 16, border: '1px solid #ffe58f', background: '#fffbe6' }}>
        <Space align="center">
          <ClockCircleOutlined style={{ fontSize: 24, color: '#d48806' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#d48806' }}>
              Vòng Chung kết chưa mở
            </Title>
            <Text style={{ color: '#ad6800' }}>
              Đội của bạn đã được chọn vào Chung kết. Coordinator sẽ kích hoạt vòng thi — bạn có thể nộp bài sau khi
              vòng được mở.
            </Text>
          </div>
        </Space>
      </Card>
    );
  }

  if (!isEligible) {
    return null;
  }

  const isSubmitted = !!existingSubmission;
  const deadline = finalRound.submissionDeadline || finalRound.submission_deadline;

  const handleFinish = async (values) => {
    await submitFinalWork({
      repoUrl: values.repoUrl || '',
      demoUrl: values.demoUrl || '',
      slideFile: slideFile || undefined,
    });
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        border: isLocked && !isSubmitted ? '1px solid #ffccc7' : '1px solid #e2e8f0',
      }}
      styles={{ body: { padding: 32 } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Title level={3} style={{ margin: 0 }}>
              Nộp bài Chung kết
            </Title>
            {isSubmitted ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 600 }}>
                ĐÃ NỘP BÀI
              </Tag>
            ) : isLocked ? (
              <Tag
                color="error"
                icon={<CloseCircleOutlined />}
                style={{ fontWeight: 600, fontSize: 14, padding: '4px 8px' }}
              >
                REJECTED (Nộp muộn)
              </Tag>
            ) : (
              <Tag color="processing" style={{ fontWeight: 600 }}>
                ĐANG MỞ
              </Tag>
            )}
          </Space>
          <Text type="secondary" style={{ display: 'block' }}>
            Hạn chót: {deadline ? new Date(deadline).toLocaleString('vi-VN') : 'Chưa công bố'}
          </Text>
        </div>

        <div
          style={{
            background: isLocked ? '#fff2f0' : '#e6f4ff',
            padding: '12px 24px',
            borderRadius: 12,
            border: `1px solid ${isLocked ? '#ffccc7' : '#bae0ff'}`,
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: isLocked ? '#cf1322' : '#0958d9',
            }}
          >
            {isLocked ? 'TRẠNG THÁI' : 'THỜI GIAN CÒN LẠI'}
          </Text>
          <Title
            level={4}
            style={{ margin: 0, color: isLocked ? '#cf1322' : '#1677ff', fontFamily: 'monospace' }}
          >
            {timeLeft}
          </Title>
        </div>
      </div>

      {isLocked && !isSubmitted && (
        <Alert
          message="Đã khóa cổng nộp bài"
          description="Thời gian nộp bài Chung kết đã kết thúc. Hệ thống đã khóa cứng (Hard-lock) toàn bộ form nộp bài theo quy định. Bài thi không được ghi nhận mang trạng thái REJECTED."
          type="error"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Row gutter={48}>
        <Col xs={24} lg={8}>
          <div
            style={{
              background: '#fafafa',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              height: '100%',
            }}
          >
            <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilePdfOutlined style={{ color: '#1677ff' }} />
              Yêu cầu & Tiêu chí
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              Sản phẩm của bạn sẽ được đánh giá theo tiêu chí Vòng Chung kết từ hệ thống. Vui lòng đảm bảo slide thể
              hiện rõ các yếu tố này:
            </Paragraph>

            {criteriaLoading ? (
              <Spin size="small" />
            ) : criteria.length === 0 ? (
              <Text type="secondary">Chưa có tiêu chí Chung kết — liên hệ Coordinator.</Text>
            ) : (
              <ul style={{ paddingLeft: 16, marginTop: 16 }}>
                {criteria.map((c) => (
                  <li key={c.id} style={{ marginBottom: 12, color: '#434343', fontWeight: 500 }}>
                    {c.name || c.criterionName}{' '}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {formatWeight(c.weight)}
                    </Tag>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Col>

        <Col xs={24} lg={16}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            disabled={isLocked || isSubmitted}
            initialValues={existingSubmission || {}}
          >
            <Form.Item
              label={
                <span style={{ fontWeight: 600 }}>
                  File Slide Thuyết trình PDF <span style={{ color: 'red' }}>*</span>
                </span>
              }
              required
            >
              <Upload
                accept=".pdf,application/pdf"
                maxCount={1}
                beforeUpload={(file) => {
                  const isPdf =
                    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                  if (!isPdf) {
                    return Upload.LIST_IGNORE;
                  }
                  setSlideFile(file);
                  return false;
                }}
                onRemove={() => setSlideFile(null)}
                disabled={isLocked || isSubmitted}
              >
                <Button icon={<CloudUploadOutlined />} disabled={isLocked || isSubmitted}>
                  Chọn file PDF
                </Button>
              </Upload>
              {(existingSubmission?.slideFile || existingSubmission?.slide_file) && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Đã nộp: {existingSubmission.slideFile || existingSubmission.slide_file}
                </Text>
              )}
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="demoUrl" label="Link Demo Sản phẩm (Nếu có)">
                  <Input
                    prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="https://..."
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="repoUrl" label="Link Source Code (Github/Gitlab)">
                  <Input
                    prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="https://github.com/..."
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>
            {!isSubmitted && (
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                icon={<CloudUploadOutlined />}
                loading={isSubmitting}
                disabled={isLocked}
                style={{
                  width: 200,
                  height: 48,
                  borderRadius: 12,
                  fontWeight: 700,
                  background: isLocked ? '#d9d9d9' : '#1677ff',
                  borderColor: isLocked ? '#d9d9d9' : '#1677ff',
                }}
              >
                Gửi Bài Dự Thi
              </Button>
            )}
          </Form>
        </Col>
      </Row>
    </Card>
  );
};

export default FinalSubmissionPanel;
