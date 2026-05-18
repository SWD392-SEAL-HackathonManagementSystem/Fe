import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Input, Badge, Avatar, Space, Popover, List, Typography } from 'antd';
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
  LayoutDashboard, Trophy, Users, Activity, BarChart3, Settings, HelpCircle,
  Mail, CalendarClock, AlertTriangle, CheckCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAppContext } from '../../../app/AppContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  
  // Lấy dữ liệu global từ AppContext
  const { notifications, markAsRead } = useAppContext();

  const menuItems = [
    { key: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} />, label: 'Tổng quan' },
    { key: ROUTES.HACKATHONS, icon: <Trophy size={18} />, label: 'Cấu hình Sự kiện' },
    { key: 'teams', icon: <Users size={18} />, label: 'Quản lý Đội thi' },
    { key: 'monitor', icon: <Activity size={18} />, label: 'Giám sát Real-time' },
    { key: 'analytics', icon: <BarChart3 size={18} />, label: 'Phân tích dữ liệu' },
    { key: 'settings', icon: <Settings size={18} />, label: 'Cài đặt Hệ thống' },
  ];

  const bottomMenuItems = [
    { key: 'help', icon: <HelpCircle size={18} />, label: 'Trung tâm Hỗ trợ' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === ROUTES.DASHBOARD || key === ROUTES.HACKATHONS) navigate(key);
  };

  // UI Helpers cho Notification
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotifConfig = (type) => {
    switch(type) {
      case 'INVITATION': return { icon: <Mail size={16} color="#1677ff" />, bg: '#e6f4ff' };
      case 'REMINDER': return { icon: <CalendarClock size={16} color="#52c41a" />, bg: '#f6ffed' };
      case 'WARNING': return { icon: <AlertTriangle size={16} color="#faad14" />, bg: '#fffbe6' };
      default: return { icon: <BellOutlined style={{color: '#1677ff'}}/>, bg: '#e6f4ff' };
    }
  };

  const notificationContent = (
    <div style={{ width: 340 }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Thông báo hệ thống</Text>
        <Button type="link" size="small" onClick={() => markAsRead('ALL')} disabled={unreadCount === 0} icon={<CheckCheck size={14} />}>
          Đã đọc tất cả
        </Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications.slice(0, 5)} // Chỉ show 5 thông báo mới nhất
        locale={{ emptyText: 'Không có thông báo mới' }}
        renderItem={item => {
          const config = getNotifConfig(item.type);
          return (
            <List.Item 
              style={{ padding: '12px 8px', cursor: 'pointer', opacity: item.is_read ? 0.6 : 1, transition: 'background 0.3s', borderRadius: 6 }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => markAsRead(item.id)}
            >
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} icon={config.icon} />}
                title={<span style={{ fontSize: 14, fontWeight: item.is_read ? 400 : 600 }}>{item.title}</span>}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>{item.time}</Text>
                  </div>
                }
              />
              {!item.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1677ff', marginLeft: 8 }} />}
            </List.Item>
          );
        }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" width={260} style={{ boxShadow: '2px 0 8px 0 rgba(29,35,41,.03)', zIndex: 10, position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0 }}>
        {/* ... (Các phần Sidebar giữ nguyên như cũ, chỉ rút gọn để hiển thị) ... */}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', padding: '0 24px', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)', borderRadius: 8, marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 20 }}>H</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#141414', lineHeight: '1.2' }}>HackOS</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Quản trị viên Doanh nghiệp</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div style={{ padding: '0 16px 24px' }}>
            <Button type="primary" icon={<PlusOutlined />} block size="large" style={{ height: 48, borderRadius: 8, fontWeight: 600 }} onClick={() => navigate(ROUTES.HACKATHON_CREATE)}>Tạo Sự kiện Mới</Button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', justifyContent: 'space-between' }}>
          <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} style={{ borderRight: 0 }} />
          <Menu mode="inline" items={bottomMenuItems} style={{ borderRight: 0, marginBottom: 24 }} />
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.05)', position: 'sticky', top: 0, zIndex: 9, height: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 40, height: 40, marginRight: 16 }} />
            <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Tìm kiếm nhóm, giám khảo, cài đặt..." style={{ maxWidth: 400, borderRadius: 8, background: '#f5f5f5', border: 'none', height: 40 }} />
          </div>
          
          <Space size={20}>
            {/* THỰC TẾ HÓA CHUÔNG THÔNG BÁO TỪ CONTEXT */}
            <Popover content={notificationContent} trigger="click" placement="bottomRight" arrow={false}>
              <Badge count={unreadCount} offset={[-4, 4]}>
                <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
              </Badge>
            </Popover>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: 20 }} />} />
            <Button type="text" icon={<QuestionCircleOutlined style={{ fontSize: 20 }} />} />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style={{ cursor: 'pointer', border: '2px solid #f0f0f0' }} />
          </Space>
        </Header>
        
        <Content style={{ margin: '24px', minHeight: 280, borderRadius: borderRadiusLG }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;