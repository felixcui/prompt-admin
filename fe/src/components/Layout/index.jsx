import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Space, Select, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ProjectOutlined,
  MessageOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRequest } from '../../hooks/useRequest';
import { getWorkspaces, logout } from '../../services/api';
import useWorkspaceStore from '../../stores/workspaceStore';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const isAdmin = currentUser?.role === 'superadmin';
  
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState([]);

  // 获取工作空间列表
  const {
    loading: workspaceLoading,
    run: fetchWorkspaces
  } = useRequest(async () => {
    const list = await getWorkspaces();
    setWorkspaces(list);
    
    // 如果没有选择工作空间，且有可用的工作空间，自动选择第一个
    if (!currentWorkspace && list.length > 0) {
      const defaultWorkspace = list[0];
      setCurrentWorkspace(defaultWorkspace);
      
      // 如果当前在项目或提示词页面，需要刷新页面
      if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
        navigate(`/projects?workspaceId=${defaultWorkspace.id}`);
      }
    } else if (currentWorkspace) {
      // 验证当前工作空间是否还在可访问列表中
      const stillAccessible = list.some(w => w.id === currentWorkspace.id);
      if (!stillAccessible && list.length > 0) {
        setCurrentWorkspace(list[0]);
        if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
          navigate(`/projects?workspaceId=${list[0].id}`);
        }
      }
    }
  });

  // 在组件挂载和用户信息变化时获取工作空间列表
  useEffect(() => {
    if (currentUser?.id) {
      fetchWorkspaces();
    }
  }, [currentUser?.id, fetchWorkspaces]);

  const handleLogout = () => {
    logout();
  };

  const handleWorkspaceChange = (workspaceId) => {
    if (!workspaceId) {
      setCurrentWorkspace(null);
      if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
        navigate('/workspaces');
      }
      return;
    }

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      // 如果当前在项目或提示词页面，需要刷新页面
      if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
        navigate(`/projects?workspaceId=${workspace.id}`);
      }
    }
  };

  const handleWorkspaceSelect = async () => {
    // 每次点击下拉框时重新获取工作空间列表
    try {
      const list = await getWorkspaces();
      setWorkspaces(list);
      
      // 验证当前工作空间是否还在可访问列表中
      if (currentWorkspace) {
        const stillAccessible = list.some(w => w.id === currentWorkspace.id);
        if (!stillAccessible && list.length > 0) {
          setCurrentWorkspace(list[0]);
          if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
            navigate(`/projects?workspaceId=${list[0].id}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      message.error('获取工作空间列表失败');
    }
  };

  const userMenuOverlay = (
    <div style={{ 
      padding: '8px 0', 
      backgroundColor: '#fff',
      boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)',
      borderRadius: '2px'
    }}>
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ marginBottom: 4, color: '#00000073' }}>当前用户</div>
        <div style={{ fontWeight: 500 }}>{currentUser.username}</div>
        <div style={{ fontSize: '12px', color: '#00000073' }}>
          {isAdmin ? '超级管理员' : '普通用户'}
        </div>
      </div>
      <div style={{ padding: '8px 0' }}>
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ marginBottom: 4, color: '#00000073' }}>当前工作空间</div>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择工作空间"
            value={currentWorkspace?.id}
            onChange={handleWorkspaceChange}
            loading={workspaceLoading}
            options={workspaces.map(w => ({
              label: w.name,
              value: w.id,
            }))}
            allowClear
            onClear={() => {
              setCurrentWorkspace(null);
              if (location.pathname.startsWith('/projects') || location.pathname.startsWith('/prompts')) {
                navigate('/workspaces');
              }
            }}
            dropdownStyle={{ minWidth: '200px' }}
            onDropdownVisibleChange={(open) => {
              if (open) {
                handleWorkspaceSelect();
              }
            }}
          />
        </div>
      </div>
      <Menu
        style={{ border: 'none' }}
        items={[
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
            danger: true
          }
        ]}
      />
    </div>
  );

  const menuItems = [
    {
      key: 'workspaces',
      icon: <TeamOutlined />,
      label: '工作空间',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: 'prompts',
      icon: <MessageOutlined />,
      label: '提示词管理',
    },
    ...(isAdmin ? [{
      key: 'models',
      icon: <ApiOutlined />,
      label: '模型管理',
    }] : [])
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0 }}
      >
        <div style={{ 
          height: 64, 
          lineHeight: '64px', 
          textAlign: 'center', 
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          {!collapsed && '提示词平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split('/')[1] || 'workspaces']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          position: 'fixed',
          top: 0,
          right: 0,
          width: `calc(100% - ${collapsed ? 80 : 200}px)`,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          transition: 'all 0.2s'
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '18px' }
          })}
          <Space>
            {currentWorkspace && (
              <span style={{ color: '#00000073' }}>
                当前空间：{currentWorkspace.name}
              </span>
            )}
            <Dropdown 
              overlay={userMenuOverlay} 
              placement="bottomRight"
              trigger={['click']}
              overlayStyle={{
                width: '280px',
                padding: 0
              }}
            >
              <Space style={{ 
                cursor: 'pointer',
                padding: '0 4px',
                borderRadius: '4px',
                transition: 'all 0.3s',
                ':hover': {
                  backgroundColor: 'rgba(0,0,0,0.025)'
                }
              }}>
                <UserOutlined />
                <span>{currentUser.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: '88px 24px 24px',
          minHeight: 280,
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center'
        }}>
          <div style={{ 
            background: '#fff',
            padding: 24,
            borderRadius: 4,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;