import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Select, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRequest } from '../../hooks/useRequest';
import { 
  getWorkspaceMembers, 
  addWorkspaceMembers,
  removeWorkspaceMembers,
  getUsers 
} from '../../services/api';

const WorkspaceMembers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspace } = location.state || {};
  const [currentMembers, setCurrentMembers] = useState([]);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState([]);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // 获取工作空间成员
  const {
    loading: membersLoading,
    run: fetchWorkspaceMembers
  } = useRequest(async () => {
    const members = await getWorkspaceMembers(workspace.id);
    setCurrentMembers(members);
  });

  // 获取用户列表
  const {
    loading: usersLoading,
    run: fetchUsers
  } = useRequest(async () => {
    const userList = await getUsers();
    setUsers(userList.filter(u => u.role !== 'superadmin'));
  });

  // 添加成员
  const {
    loading: addLoading,
    run: handleAddMembers
  } = useRequest(async (userIds) => {
    try {
      await addWorkspaceMembers(workspace.id, userIds);
      message.success('成员添加成功！');
      setIsAddMemberModalVisible(false);
      setSelectedUserIds([]);
      fetchWorkspaceMembers();
    } catch (error) {
      message.error('添加成员失败');
    }
  });

  // 除成员
  const {
    loading: removeMemberLoading,
    run: handleRemoveMembers
  } = useRequest(async (memberIds) => {
    try {
      await removeWorkspaceMembers(workspace.id, memberIds);
      message.success('成员移除成功！');
      setSelectedMembersToRemove([]);
      fetchWorkspaceMembers();
    } catch (error) {
      message.error('移除成员失败');
    }
  });

  useEffect(() => {
    if (workspace?.id) {
      fetchWorkspaceMembers();
    } else {
      navigate('/workspaces');
    }
  }, [workspace?.id, navigate, fetchWorkspaceMembers]);

  // 修改打开添加成员弹窗的处理函数
  const handleOpenAddMemberModal = () => {
    setIsAddMemberModalVisible(true);
    // 每次打开弹窗时重新获取用户列表
    fetchUsers();
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/workspaces')}
            style={{ paddingLeft: 0 }}
          >
            返回工作空间列表
          </Button>
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {workspace?.name} - 成员管理
          </span>
        </Space>
        <Button
          type="primary"
          onClick={handleOpenAddMemberModal}  // 使用新的处理函数
        >
          添加成员
        </Button>
      </div>

      <Table
        loading={membersLoading}
        rowSelection={{
          selectedRowKeys: selectedMembersToRemove,
          onChange: (selectedRowKeys) => setSelectedMembersToRemove(selectedRowKeys),
        }}
        columns={[
          {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
          },
          {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
          },
          {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role, record) => {
              // 检查是否是工作空间管理员
              if (workspace.adminId === record.id) {
                return '管理员';
              }
              return role === 'superadmin' ? '超级管理员' : '普通用户';
            }
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Button
                type="link"
                danger
                disabled={workspace.adminId === record.id}  // 修改这里，使用工作空间管理员ID判断
                onClick={() => {
                  Modal.confirm({
                    title: '确认移除成员',
                    content: `确定要移除成员 ${record.username} 吗？`,
                    onOk: () => handleRemoveMembers([record.id])
                  });
                }}
              >
                移除
              </Button>
            )
          }
        ]}
        dataSource={currentMembers}
        rowKey="id"
        pagination={false}
        footer={() => selectedMembersToRemove.length > 0 && (
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              danger
              loading={removeMemberLoading}
              onClick={() => {
                Modal.confirm({
                  title: '确认批量移除成员',
                  content: `确定要移除选中的 ${selectedMembersToRemove.length} 个成员吗？`,
                  onOk: () => handleRemoveMembers(selectedMembersToRemove)
                });
              }}
            >
              批量移除选中成员
            </Button>
          </div>
        )}
      />

      <Modal
        title="添加成员"
        open={isAddMemberModalVisible}
        onCancel={() => {
          setIsAddMemberModalVisible(false);
          setSelectedUserIds([]);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsAddMemberModalVisible(false);
              setSelectedUserIds([]);
            }}
          >
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={addLoading}
            disabled={selectedUserIds.length === 0}
            onClick={() => handleAddMembers(selectedUserIds)}
          >
            添加
          </Button>
        ]}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="请选择要添加的成员"
          loading={usersLoading}
          value={selectedUserIds}
          onChange={setSelectedUserIds}
          options={users
            .filter(user => !currentMembers.find(m => m.id === user.id))
            .map(user => ({
              label: `${user.username}${user.email ? ` (${user.email})` : ''}`,
              value: user.id,
              disabled: user.role === 'admin'
            }))}
          optionFilterProp="label"
          showSearch
        />
      </Modal>
    </>
  );
};

export default WorkspaceMembers; 