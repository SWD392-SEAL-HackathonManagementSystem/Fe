import React from 'react';
import { Card, Button, Form, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import HackathonForm from '../components/HackathonForm';
import { ROUTES } from '../../../shared/constants/routes';
import { useAppContext } from '../../../app/AppContext';
import dayjs from 'dayjs';

const CreateHackathonPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { addHackathon } = useAppContext();

  const handleFinish = (values) => {
    // Convert dayjs objects to strings
    const formattedValues = {
      ...values,
      registration_start: values.registration_start?.format('YYYY-MM-DD HH:mm'),
      registration_end: values.registration_end?.format('YYYY-MM-DD HH:mm'),
      event_start: values.event_start?.format('YYYY-MM-DD HH:mm'),
      event_end: values.event_end?.format('YYYY-MM-DD HH:mm'),
    };

    const newHackathon = addHackathon(formattedValues);
    message.success('Đã tạo sự kiện thành công');
    navigate(ROUTES.HACKATHONS);
  };

  return (
    <div>
      <PageHeader 
        title="Tạo Sự kiện Mới" 
        subtitle="Thiết lập các thông tin cơ bản cho sự kiện hackathon của bạn"
        onBack={() => navigate(ROUTES.HACKATHONS)}
      />
      
      <Card style={{ borderRadius: 12 }}>
        <HackathonForm form={form} onFinish={handleFinish} />
        
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={() => navigate(ROUTES.HACKATHONS)}>Hủy</Button>
            <Button type="primary" onClick={() => form.submit()} size="large">
              Tạo Sự kiện
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CreateHackathonPage;
