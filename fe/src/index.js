import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ConfigProvider locale={zhCN}>
    <App />
  </ConfigProvider>
); 