import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Select } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined, IdcardOutlined, BankOutlined, GithubOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from '../../../shared/constants/routes';
import { useGoogleLogin } from '@react-oauth/google';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('INTERNAL');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await axios.post('/api/v1/auth/google', {
          token: tokenResponse.access_token,
        });

        const { data } = response;
        if (data.status === 200 || data.code === 200 || response.status === 200) {
          message.success('Đăng nhập Google thành công!');
          const accessToken = data.data?.accessToken || data.accessToken;
          const refreshToken = data.data?.refreshToken || data.refreshToken;
          
          if (accessToken) localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          
          navigate(ROUTES.DASHBOARD);
        } else {
          message.error(data.message || 'Đăng nhập thất bại!');
        }
      } catch (error) {
        console.error('Google login error:', error);
        message.error('Có lỗi xảy ra khi đăng nhập bằng Google!');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      message.error('Đăng nhập Google thất bại!');
    },
  });

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/register', {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        userType: values.userType,
        studentCode: values.userType === 'INTERNAL' ? values.studentCode : null,
        institution: values.userType === 'EXTERNAL' ? values.institution : null,
        chapterId: values.userType === 'INTERNAL' ? values.chapterId : null,
      });

      if (response.status === 200 || response.data?.code === 200) {
        message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        navigate(ROUTES.LOGIN);
      } else {
        message.error(response.data?.message || 'Đăng ký thất bại!');
      }
    } catch (error) {
      console.error('Register error:', error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f3f4f6',
        backgroundImage: `url('https://daihoc.fpt.edu.vn/wp-content/uploads/2022/08/dai-hoc-fpt-tp-hcm-1.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        fontFamily: "'Inter', sans-serif",
        color: '#111827',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderBottom: 'none',
          backgroundColor: 'transparent',
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          HACKATHON
        </div>
        <nav style={{ display: 'flex', gap: '30px', color: '#ffffff', fontSize: '14px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Schedules</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Prizes</a>
        </nav>
        <Button
          style={{
            backgroundColor: '#0072ff',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '0 24px',
            fontWeight: '600',
            height: '36px',
          }}
          onClick={() => navigate(ROUTES.LOGIN)}
        >
          Login
        </Button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid #0072ff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #0072ff, #00e5ff)',
            }}
          />
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                background: 'linear-gradient(90deg, #0072ff, #00e5ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Tham gia cùng chúng tôi
            </h1>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
              Đăng ký tài khoản để bắt đầu hành trình Hackathon
            </p>
          </div>

          <Form
            form={form}
            name="register_form"
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ userType: 'INTERNAL', chapterId: 1 }}
            requiredMark={false}
          >
            <Form.Item
              label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>HỌ VÀ TÊN</span>}
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              style={{ marginBottom: '20px' }}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#0072ff', marginRight: '8px' }} />}
                placeholder="Nguyễn Văn A"
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                  height: '48px',
                  borderRadius: '16px',
                }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>EMAIL</span>}
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
              style={{ marginBottom: '20px' }}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#0072ff', marginRight: '8px' }} />}
                placeholder="example@fpt.edu.vn"
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                  height: '48px',
                  borderRadius: '16px',
                }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>ĐỐI TƯỢNG</span>}
              name="userType"
              style={{ marginBottom: '20px' }}
            >
              <Select
                onChange={(val) => setUserType(val)}
                className="custom-select"
                style={{ height: '48px' }}
                dropdownStyle={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}
              >
                <Option value="INTERNAL" style={{ color: '#111827' }}>Sinh viên FPT (Nội bộ)</Option>
                <Option value="EXTERNAL" style={{ color: '#111827' }}>Sinh viên trường khác (Bên ngoài)</Option>
              </Select>
            </Form.Item>

            {userType === 'INTERNAL' && (
              <>
                <Form.Item
                  label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>CƠ SỞ (CHAPTER)</span>}
                  name="chapterId"
                  rules={[{ required: true, message: 'Vui lòng chọn cơ sở!' }]}
                  style={{ marginBottom: '20px' }}
                >
                  <Select
                    className="custom-select"
                    style={{ height: '48px' }}
                    dropdownStyle={{ backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}
                  >
                    <Option value={1} style={{ color: '#111827' }}>FPT HCM</Option>
                    <Option value={2} style={{ color: '#111827' }}>FPT HN</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>MÃ SINH VIÊN (FPT)</span>}
                  name="studentCode"
                  rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên!' }]}
                  style={{ marginBottom: '20px' }}
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#0072ff', marginRight: '8px' }} />}
                    placeholder="VD: SE123456"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      color: '#111827',
                      height: '48px',
                      borderRadius: '16px',
                    }}
                    className="custom-input"
                  />
                </Form.Item>
              </>
            )}

            {userType === 'EXTERNAL' && (
              <Form.Item
                label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>TÊN TRƯỜNG / TỔ CHỨC</span>}
                name="institution"
                rules={[{ required: true, message: 'Vui lòng nhập tên trường!' }]}
                style={{ marginBottom: '20px' }}
              >
                <Input
                  prefix={<BankOutlined style={{ color: '#0072ff', marginRight: '8px' }} />}
                  placeholder="Đại học Bách Khoa..."
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    color: '#111827',
                    height: '48px',
                    borderRadius: '16px',
                  }}
                  className="custom-input"
                />
              </Form.Item>
            )}

            <Form.Item
              label={<span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>MẬT KHẨU</span>}
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 8, message: 'Mật khẩu phải từ 8 ký tự trở lên!' }]}
              style={{ marginBottom: '28px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#0072ff', marginRight: '8px' }} />}
                placeholder="••••••••"
                iconRender={(visible) => (visible ? <EyeTwoTone twoToneColor="#4b5563" /> : <EyeInvisibleOutlined style={{ color: '#9ca3af' }} />)}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#111827',
                  height: '48px',
                  borderRadius: '16px',
                }}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  border: 'none',
                  background: 'linear-gradient(90deg, #0072ff, #00e5ff)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                Đăng ký <ArrowRightOutlined />
              </Button>
            </Form.Item>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ padding: '0 12px', color: '#9ca3af', fontSize: '12px' }}>HOẶC</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Button
                icon={<GithubOutlined />}
                style={{
                  flex: 1,
                  height: '40px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: '16px',
                  fontWeight: '600',
                }}
              >
                GitHub
              </Button>
              <Button
                icon={<GoogleOutlined />}
                onClick={() => loginWithGoogle()}
                style={{
                  flex: 1,
                  height: '40px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: '16px',
                  fontWeight: '600',
                }}
              >
                Google
              </Button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px' }}>
              <span style={{ color: '#4b5563' }}>Đã có tài khoản? </span>
              <a onClick={() => navigate(ROUTES.LOGIN)} style={{ color: '#0072ff', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer' }}>
                Đăng nhập ngay
              </a>
            </div>
          </Form>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '30px 40px',
          backgroundColor: 'transparent',
          borderTop: 'none',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          HACKATHON
        </div>
        <div style={{ color: '#f3f4f6', fontSize: '12px', fontWeight: '500', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          © 2024 HACKATHON. ALL RIGHTS RESERVED.
        </div>
        <div style={{ display: 'flex', gap: '24px', color: '#ffffff', fontSize: '13px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Discord</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Twitter</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>

      <style>{`
        .custom-input {
          overflow: hidden !important;
        }
        .custom-input input::placeholder, .custom-input .ant-input::placeholder {
          color: #9ca3af !important;
        }
        .custom-input input, .custom-input .ant-input-password {
          background-color: transparent !important;
          color: #111827 !important;
          border-radius: 16px !important;
        }
        .custom-input .ant-input {
          background-color: transparent !important;
          color: #111827 !important;
          border-radius: 16px !important;
        }
        .custom-input:hover, .custom-input:focus-within {
          border-color: #0072ff !important;
          box-shadow: 0 0 0 2px rgba(0, 114, 255, 0.1) !important;
        }
        .ant-form-item-label > label {
          color: #4b5563 !important;
        }
        /* Fix cho màu nền tự động điền (autofill) của trình duyệt */
        .custom-input input:-webkit-autofill,
        .custom-input input:-webkit-autofill:hover, 
        .custom-input input:-webkit-autofill:focus, 
        .custom-input input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #f9fafb inset !important;
          -webkit-text-fill-color: #111827 !important;
          transition: background-color 5000s ease-in-out 0s;
          border-radius: 0 !important;
        }
        .custom-select .ant-select-selector {
          background-color: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          color: #111827 !important;
          height: 48px !important;
          border-radius: 16px !important;
          align-items: center !important;
        }
        .custom-select:hover .ant-select-selector, .custom-select.ant-select-focused .ant-select-selector {
          border-color: #0072ff !important;
          box-shadow: 0 0 0 2px rgba(0, 114, 255, 0.1) !important;
        }
        .custom-select .ant-select-arrow {
          color: #0072ff !important;
        }
        /* Style for options in dropdown */
        .ant-select-dropdown {
          background-color: #ffffff !important;
        }
        .ant-select-item-option {
          color: #111827 !important;
        }
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background-color: #f3f4f6 !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: #e0f2fe !important;
          color: #0072ff !important;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
