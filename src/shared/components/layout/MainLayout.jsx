import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Input, Badge, Avatar, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  SearchOutlined, 
  BellOutlined, 
  SettingOutlined, 
  QuestionCircleOutlined,
  LogoutOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Activity,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: ROUTES.DASHBOARD,
      icon: <LayoutDashboard size={18} />,
      label: 'Tổng quan',
    },
    {
      key: ROUTES.HACKATHONS,
      icon: <Trophy size={18} />,
      label: 'Cấu hình Sự kiện',
    },
    {
      key: 'teams',
      icon: <Users size={18} />,
      label: 'Quản lý Đội thi',
    },
    {
      key: 'monitor',
      icon: <Activity size={18} />,
      label: 'Giám sát Real-time',
    },
    {
      key: 'analytics',
      icon: <BarChart3 size={18} />,
      label: 'Phân tích dữ liệu',
    },
    {
      key: 'settings',
      icon: <Settings size={18} />,
      label: 'Cài đặt Hệ thống',
    },
  ];

  const bottomMenuItems = [
    {
      key: 'help',
      icon: <HelpCircle size={18} />,
      label: 'Trung tâm Hỗ trợ',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === ROUTES.DASHBOARD || key === ROUTES.HACKATHONS) {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        width={260}
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.03)',
          zIndex: 10,
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ 
          height: 80, 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 24px',
          marginBottom: 8
        }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
            borderRadius: 8,
            marginRight: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 20
          }}>H</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#141414', lineHeight: '1.2' }}>HackOS</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Quản trị viên Doanh nghiệp</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div style={{ padding: '0 16px 24px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              block 
              size="large"
              style={{ height: 48, borderRadius: 8, fontWeight: 600 }}
              onClick={() => navigate(ROUTES.HACKATHON_CREATE)}
            >
              Tạo Sự kiện Mới
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', justifyContent: 'space-between' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
          <Menu
            mode="inline"
            items={bottomMenuItems}
            style={{ borderRight: 0, marginBottom: 24 }}
          />
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.05)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 72
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40, marginRight: 16 }}
            />
            <Input 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="Tìm kiếm nhóm, giám khảo, cài đặt..." 
              style={{ maxWidth: 400, borderRadius: 8, background: '#f5f5f5', border: 'none', height: 40 }}
            />
          </div>
          <Space size={20}>
            <Badge dot color="#ff4d4f">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
            </Badge>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: 20 }} />} />
            <Button type="text" icon={<QuestionCircleOutlined style={{ fontSize: 20 }} />} />
            <Avatar 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              style={{ cursor: 'pointer', border: '2px solid #f0f0f0' }} 
            />
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            minHeight: 280,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
