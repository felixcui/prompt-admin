import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRequest } from '../../hooks/useRequest';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, getUsers } from '../../services/api';
import { formatDate } from '../../utils';

const { TextArea } = Input;

const Workspaces = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [users, setUsers] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'superadmin';

  // 获取工作空间列表
  const {
    loading: listLoading,
    data: workspaceList,
    run: fetchWorkspaces
  } = useRequest(getWorkspaces, {
    initialData: [],
    onSuccess: () => {
      // 在获取工作空间列表成功后，立即获取用户列表
      fetchUsers();
    }
  });

  // 获取用户列表
  const {
    loading: usersLoading,
    run: fetchUsers
  } = useRequest(async () => {
    const userList = await getUsers();
    setUsers(userList);  // 不再过滤掉超级管理员，因为工作空间可能由超级管理员管理
  }, {
    manual: true
  });

  // 提交表单
  const {
    loading: submitLoading,
    run: handleSubmit
  } = useRequest(async (values) => {
    try {
      if (editingRecord) {
        await updateWorkspace(editingRecord.id, values);
      } else {
        await createWorkspace(values);
      }
      message.success(`${editingRecord ? '更新' : '创建'}成功！`);
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchWorkspaces();
    } catch (error) {
      // ... 错误处理
    }
  });

  // 删除工作空间
  const {
    loading: deleteLoading,
    run: handleDelete
  } = useRequest(async (id) => {
    try {
      await deleteWorkspace(id);
      message.success('删除成功！');
      fetchWorkspaces();
    } catch (error) {
      message.error('删除失败');
    }
  });

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const columns = [
    {
      title: '工作空间名称',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '管理员',
      dataIndex: 'adminName',
      key: 'adminName',
      width: '15%',
      render: (adminName, record) => {
        // 如果后端返回了 adminName 就直接使用，否则从用户列表中查找
        if (adminName) {
          return adminName;
        }
        const admin = users.find(u => u.id === record.adminId);
        return admin ? admin.username : '-';
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '20%',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isAdmin = isSuperAdmin || record.adminId === currentUser.id;
        
        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => navigate(`/projects?workspaceId=${record.id}`)}
            >
              查看项目
            </Button>
            {isAdmin && (
              <>
                <Button
                  type="link"
                  onClick={() => navigate(`/workspaces/${record.id}/members`, {
                    state: { workspace: record }
                  })}
                >
                  管理成员
                </Button>
                {isSuperAdmin && (
                  <>
                    <Button
                      type="link"
                      onClick={() => {
                        setEditingRecord(record);
                        form.setFieldsValue(record);
                        setIsModalVisible(true);
                      }}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个工作空间吗？"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger loading={deleteLoading}>
                        删除
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </>
            )}
          </Space>
        );
      },
    },
  ];

  // 修改打开模态框的处理函数
  const handleOpenModal = () => {
    setEditingRecord(null);
    form.resetFields();
    // 确保有用户列表数据
    if (users.length === 0) {
      fetchUsers();
    }
    setIsModalVisible(true);
  };

  return (
    <Card title="工作空间管理">
      {isSuperAdmin && (
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            新建工作空间
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={workspaceList}
        loading={listLoading || usersLoading}
        rowKey="id"
      />

      {/* 工作空间表单 */}
      <Modal
        title={`${editingRecord ? '编辑' : '新建'}工作空间`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="工作空间名称"
            rules={[{ required: true, message: '请输入工作空间名称！' }]}
          >
            <Input placeholder="请输入工作空间名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="adminId"
            label="管理员"
            rules={[{ required: true, message: '请选择管理员！' }]}
          >
            <Select
              placeholder="请选择管理员"
              options={users.map(user => ({
                label: user.username,
                value: user.id
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingRecord(null);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Workspaces; 