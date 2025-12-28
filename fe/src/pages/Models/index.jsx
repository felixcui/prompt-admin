import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRequest } from '../../hooks/useRequest';
import { getModels, createModel, updateModel, deleteModel } from '../../services/api';
import { formatDate } from '../../utils';

const Models = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // 获取模型列表
  const {
    loading: listLoading,
    data: modelList,
    run: fetchModels
  } = useRequest(getModels, {
    initialData: []
  });

  // 提交表单
  const {
    loading: submitLoading,
    run: handleSubmit
  } = useRequest(async (values) => {
    try {
      if (editingRecord) {
        await updateModel(editingRecord.id, values);
      } else {
        await createModel(values);
      }
      message.success(`${editingRecord ? '更新' : '创建'}成功！`);
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      fetchModels();
    } catch (error) {
      // ... 错误处理
    }
  });

  // 删除模型
  const {
    loading: deleteLoading,
    run: handleDelete
  } = useRequest(async (id) => {
    await deleteModel(id);
    message.success('删除成功！');
    fetchModels();
  });

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '模型描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'API地址',
      dataIndex: 'apiUrl',
      key: 'apiUrl',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
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
            title="确定要删除这个模型吗？"
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
      <Card
        title="模型管理"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            新建模型
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={modelList}
          loading={listLoading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={`${editingRecord ? '编辑' : '新建'}模型`}
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
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称！' }]}
          >
            <Input placeholder="请输入模型名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="模型描述"
          >
            <Input.TextArea rows={4} placeholder="请输入模型描述" />
          </Form.Item>
          <Form.Item
            name="apiUrl"
            label="API地址"
            rules={[{ required: true, message: '请输入API地址！' }]}
          >
            <Input placeholder="请输入API地址" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥！' }]}
          >
            <Input.Password placeholder="请输入API密钥" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                保存
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingRecord(null);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Models; 