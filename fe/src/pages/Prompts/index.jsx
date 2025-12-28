import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRequest } from '../../hooks/useRequest';
import { getPrompts, createPrompt, updatePrompt, deletePrompt, getProjects } from '../../services/api';
import { formatDate } from '../../utils';
import useWorkspaceStore from '../../stores/workspaceStore';

const { TextArea } = Input;

const Prompts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('projectId');
  const workspaceId = searchParams.get('workspaceId');

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);

  const { currentWorkspace } = useWorkspaceStore();

  // 获取提示词列表
  const {
    loading: listLoading,
    data: promptList = [],
    run: fetchPrompts
  } = useRequest(async () => {
    const params = {
      projectId: projectId ? Number(projectId) : null,
      workspaceId: !projectId && currentWorkspace?.id ? currentWorkspace.id : null
    };
    return await getPrompts(params.projectId, params.workspaceId);
  }, {
    initialData: [],
    refreshDeps: [projectId, currentWorkspace?.id]
  });

  // 获取项目列表
  const {
    loading: projectLoading,
    run: fetchProjects
  } = useRequest(async () => {
    const projects = await getProjects(currentWorkspace?.id);
    setProjectOptions(projects.map(p => ({
      label: p.name,
      value: p.id
    })));
  });

  // 提交表单
  const {
    loading: submitLoading,
    run: handleSubmit
  } = useRequest(async (values) => {
    try {
      if (editingRecord) {
        await updatePrompt(editingRecord.id, values);
      } else {
        await createPrompt({
          ...values,
          projectId: projectId ? Number(projectId) : values.projectId
        });
      }
      message.success(`${editingRecord ? '更新' : '创建'}成功！`);
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchPrompts();
    } catch (error) {
      console.error('Error submitting prompt:', error);
    }
  });

  // 添加删除提示词的处理函数
  const {
    loading: deleteLoading,
    run: handleDelete
  } = useRequest(async (id) => {
    try {
      await deletePrompt(id);
      message.success('删除成功！');
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  });

  useEffect(() => {
    if (currentWorkspace || projectId) {
      fetchPrompts();
      fetchProjects();
    }
  }, [currentWorkspace, projectId, fetchPrompts, fetchProjects]);

  const columns = [
    {
      title: '提示词名称',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/prompts/${record.id}`, {
            state: { 
              projectId: projectId ? Number(projectId) : undefined,
              workspaceId: workspaceId ? Number(workspaceId) : undefined,
              promptName: record.name
            }
          })}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: '15%',
      render: (projectName) => projectName || '-',
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: '15%',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => navigate(`/prompts/${record.id}`, {
              state: { 
                projectId: projectId ? Number(projectId) : undefined,
                workspaceId: workspaceId ? Number(workspaceId) : undefined,
                promptName: record.name
              }
            })}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => navigate(`/prompts/${record.id}/history`, {
              state: { 
                projectId: projectId ? Number(projectId) : undefined,
                workspaceId: workspaceId ? Number(workspaceId) : undefined,
                promptName: record.name
              }
            })}
          >
            历史版本
          </Button>
          <Popconfirm
            title="确定要删除这个提示词吗？"
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

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {projectId && (
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/projects')}
              style={{ paddingLeft: 0 }}
            >
              返回项目列表
            </Button>
          )}
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            提示词管理
          </span>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            if (projectId) {
              form.setFieldsValue({ projectId: Number(projectId) });
            }
            setIsModalVisible(true);
          }}
        >
          新建提示词
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={promptList}
        loading={listLoading}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={`${editingRecord ? '编辑' : '新建'}提示词`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="提示词名称"
            rules={[{ required: true, message: '请输入提示词名称！' }]}
          >
            <Input placeholder="请输入提示词名称" />
          </Form.Item>
          {!projectId && (
            <Form.Item
              name="projectId"
              label="所属项目"
              rules={[{ required: true, message: '请选择所属项目！' }]}
            >
              <Select
                placeholder="请选择所属项目"
                options={projectOptions}
                loading={projectLoading}
              />
            </Form.Item>
          )}
          <Form.Item
            name="content"
            label="提示词内容"
            rules={[{ required: true, message: '请输入提示词内容！' }]}
          >
            <TextArea rows={10} placeholder="请输入提示词内容" />
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

export default Prompts;