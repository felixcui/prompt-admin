import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Select, message, Button, Modal, Tag } from 'antd';
import { useRequest } from '../../hooks/useRequest';
import { getProjects, getUsers, getProjectPermissions, updateProjectPermissions } from '../../services/api';

const Permissions = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectPermissions, setProjectPermissions] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // 获取项目列表
  const {
    loading: projectsLoading,
    run: fetchProjects
  } = useRequest(async () => {
    const projectList = await getProjects();
    setProjects(projectList);
    // 获取每个项目的权限
    projectList.forEach(project => {
      fetchProjectPermissions(project.id);
    });
  });

  // 获取用户列表
  const {
    loading: usersLoading,
    run: fetchUsers
  } = useRequest(async () => {
    const userList = await getUsers();
    setUsers(userList.filter(u => u.role !== 'admin')); // 过滤掉管理员
  });

  // 获取项目权限
  const {
    run: fetchProjectPermissions
  } = useRequest(async (projectId) => {
    const permissions = await getProjectPermissions(projectId);
    setProjectPermissions(prev => ({
      ...prev,
      [projectId]: permissions
    }));
  });

  // 更新项目权限
  const {
    loading: updateLoading,
    run: handleUpdatePermissions
  } = useRequest(async () => {
    if (!currentProject) return;
    await updateProjectPermissions(currentProject.id, selectedUsers);
    message.success('权限更新成功！');
    setIsModalVisible(false);
    fetchProjectPermissions(currentProject.id);
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  const handleEditPermissions = (record) => {
    setCurrentProject(record);
    setSelectedUsers(projectPermissions[record.id]?.map(u => u.id) || []);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: '项目描述',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      ellipsis: true,
    },
    {
      title: '授权用户',
      key: 'permissions',
      width: '35%',
      render: (_, record) => (
        <Space wrap>
          {projectPermissions[record.id]?.map(user => (
            <Tag key={user.id} color="blue">{user.username}</Tag>
          )) || '暂无授权用户'}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleEditPermissions(record)}
        >
          编辑权限
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card title="项目权限管理">
        <Table
          columns={columns}
          dataSource={projects}
          loading={projectsLoading || usersLoading}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={`编辑权限 - ${currentProject?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleUpdatePermissions}
        confirmLoading={updateLoading}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>选择授权用户：</h4>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择要授权的用户"
            value={selectedUsers}
            onChange={setSelectedUsers}
            options={users.map(user => ({
              label: user.username,
              value: user.id
            }))}
            optionFilterProp="label"
            showSearch
          />
        </div>
        {selectedUsers.length > 0 && (
          <div>
            <h4>已选用户：</h4>
            <Space wrap>
              {selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                return user && (
                  <Tag key={userId} color="blue">
                    {user.username}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Permissions; 