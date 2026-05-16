import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Breadcrumb } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {
  LayoutDashboard,
  Trophy,
  GitBranch,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
      label: 'Dashboard',
    },
    {
      key: ROUTES.HACKATHONS,
      icon: <Trophy size={18} />,
      label: 'Hackathons',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [{ title: <Link to="/">Home</Link> }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;
      
      // Basic logic for breadcrumb names
      let title = path.charAt(0).toUpperCase() + path.slice(1);
      if (path === 'hackathons') title = 'Hackathons';
      if (path === 'create') title = 'New Hackathon';
      if (path === 'setup') title = 'Setup';
      if (path === 'tracks') title = 'Tracks';
      if (path === 'rounds') title = 'Rounds';
      
      // If it's an ID, maybe show "Details" or similar
      if (!isNaN(path)) title = `ID: ${path}`;

      breadcrumbs.push({
        title: isLast ? title : <Link to={currentPath}>{title}</Link>
      });
    });
    
    return breadcrumbs;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          zIndex: 10,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 8
        }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
            borderRadius: 6,
            marginRight: collapsed ? 0 : 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>S</div>
          {!collapsed && <span style={{ fontSize: 18, fontWeight: 700, color: '#141414' }}>SEAL System</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 24,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            zIndex: 9,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#8c8c8c' }}>Admin Role</span>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>A</div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'initial'
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb items={getBreadcrumbs()} separator={<ChevronRight size={14} style={{ marginTop: 4 }} />} />
          </div>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
