import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRequest } from '../../hooks/useRequest';
import { getProjects, createProject, updateProject, deleteProject, getWorkspaces } from '../../services/api';
import { formatDate } from '../../utils';
import useWorkspaceStore from '../../stores/workspaceStore';

const { TextArea } = Input;

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const workspaceId = searchParams.get('workspaceId');

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  const [localWorkspace, setLocalWorkspace] = useState(null);

  const { currentWorkspace } = useWorkspaceStore();

  // 获取项目列表
  const {
    loading: listLoading,
    data: projectList,
    run: fetchProjects
  } = useRequest(async () => {
    // 如果有workspaceId参数或当前选中的workspace，则按workspace获取项目
    const wsId = workspaceId || currentWorkspace?.id;
    if (wsId) {
      return await getProjects(wsId);
    }
    // 否则获取所有项目
    return await getProjects();
  }, {
    initialData: []
  });

  // 获取工作空间列表，只在需要时获取
  const {
    loading: workspaceLoading,
    run: fetchWorkspaces
  } = useRequest(async () => {
    // 只有在没有workspaceId时才需要获取工作空间列表
    if (!workspaceId) {
      const workspaces = await getWorkspaces();
      setWorkspaceOptions(workspaces.map(w => ({ label: w.name, value: w.id })));
    } else {
      // 如果有workspaceId，获取单个工作空间信息
      const workspaces = await getWorkspaces();
      const workspace = workspaces.find(w => w.id === Number(workspaceId));
      setLocalWorkspace(workspace);
    }
  }, {
    manual: true  // 设置为手动触发
  });

  // 提交表单
  const {
    loading: submitLoading,
    run: handleSubmit
  } = useRequest(async (values) => {
    try {
      if (editingRecord) {
        await updateProject(editingRecord.id, {
          ...values,
          workspaceId: workspaceId ? Number(workspaceId) : values.workspaceId
        });
      } else {
        await createProject({
          ...values,
          workspaceId: workspaceId ? Number(workspaceId) : values.workspaceId
        });
      }
      message.success(`${editingRecord ? '更新' : '创建'}成功！`);
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchProjects();
    } catch (error) {
      // ... 错误处理
    }
  });

  // 删除项目
  const {
    loading: deleteLoading,
    run: handleDelete
  } = useRequest(async (id) => {
    await deleteProject(id);
    message.success('删除成功！');
    fetchProjects();
  });

  useEffect(() => {
    // 只在初始化和workspaceId变化时获取项目列表
    fetchProjects();
  }, [workspaceId, fetchProjects]);

  useEffect(() => {
    if (currentWorkspace?.id || workspaceId) {
      fetchProjects();
    }
  }, [currentWorkspace?.id, workspaceId, fetchProjects]);

  // 在组件挂载和workspaceId变化时获取工作空间信息
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaces();
    }
  }, [workspaceId, fetchWorkspaces]);

  const filteredProjects = workspaceId 
    ? projectList.filter(project => project.workspaceId === Number(workspaceId))
    : currentWorkspace
      ? projectList.filter(project => project.workspaceId === currentWorkspace.id)
      : projectList;

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/prompts?projectId=${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '项目描述',
      dataIndex: 'description',
      key: 'description',
      width: '20%',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '15%',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => navigate(`/prompts?projectId=${record.id}`)}
          >
            查看提示词
          </Button>
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
            title="确定要删除这个项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger loading={deleteLoading}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 只在打开创建/编辑模态框时获取工作空间列表
  const handleOpenModal = () => {
    setEditingRecord(null);
    form.resetFields();
    if (!workspaceId) {
      // 只有在没有workspaceId时才需要获取工作空间列表
      fetchWorkspaces();
    }
    if (workspaceId) {
      form.setFieldsValue({ workspaceId: Number(workspaceId) });
    }
    setIsModalVisible(true);
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {workspaceId && (
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/workspaces')}
              style={{ paddingLeft: 0 }}
            >
              返回工作空间列表
            </Button>
          )}
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {localWorkspace ? `${localWorkspace.name} - 项目列表` : '项目管理'}
          </span>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
        >
          新建项目
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProjects}
        loading={listLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={`${editingRecord ? '编辑' : '新建'}项目`}
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
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称！' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
          >
            <TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            name="workspaceId"
            label="所属工作空间"
            rules={[{ required: true, message: '请选择所属工作空间！' }]}
          >
            <Select
              placeholder="请选择所属工作空间"
              options={workspaceOptions}
              loading={workspaceLoading}
              disabled={!!workspaceId}
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
    </>
  );
};

export default Projects;