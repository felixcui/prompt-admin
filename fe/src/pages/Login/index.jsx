import React from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import api from '../../services/api';
import styles from './index.module.css';

const Login = () => {
  const [loginForm] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const { token, user } = await login(values.username, values.password);
      
      // 确保 token 和 user 都存在
      if (!token || !user) {
        message.error('登录失败：返回数据不完整');
        return;
      }

      // 存储 token 和用户信息
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 设置 axios 默认 headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      message.error(error.message || '登录失败');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard}>
        <h2 className={styles.title}>提示词平台</h2>
        <Alert
          message="请使用公司邮箱前缀和密码登录"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form
          form={loginForm}
          name="login"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 