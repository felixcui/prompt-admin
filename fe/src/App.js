import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Login from './pages/Login';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Prompts from './pages/Prompts';
import PromptEdit from './pages/Prompts/edit';
import PromptHistory from './pages/Prompts/history';
import Models from './pages/Models';
import AuthRoute from './components/AuthRoute';
import WorkspaceMembers from './pages/Workspaces/members';

// 添加管理员权限检查组件
const AdminRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const isAdmin = currentUser?.role === 'superadmin';

  if (!isAdmin) {
    return <Navigate to="/workspaces" replace />;
  }

  return children;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthRoute><Layout /></AuthRoute>}>
            <Route index element={<Navigate to="/workspaces" />} />
            <Route path="workspaces" element={<Workspaces />} />
            <Route path="workspaces/:id/members" element={<WorkspaceMembers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="prompts" element={<Prompts />} />
            <Route path="prompts/:id" element={<PromptEdit />} />
            <Route path="prompts/:id/history" element={<PromptHistory />} />
            <Route path="models" element={<AdminRoute><Models /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App; 