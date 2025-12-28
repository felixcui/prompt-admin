import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Space, message, Modal, Select, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, FullscreenOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useRequest } from '../../hooks/useRequest';
import { diffLines } from 'diff';
import { 
  updatePrompt, 
  getModels,
  getPromptHistory,
  getPromptHistoryVersion,
  getProjects,
  getPromptById,
  updatePromptBasicInfo
} from '../../services/api';
import { formatDate } from '../../utils';
import useWorkspaceStore from '../../stores/workspaceStore';

const { TextArea } = Input;

const PromptEdit = () => {
  const [form] = Form.useForm();
  const [messageForm] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { projectId, workspaceId } = location.state || {};
  const [promptName, setPromptName] = useState('');
  const [historyVersions, setHistoryVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [isDiffModalVisible, setIsDiffModalVisible] = useState(false);
  const [diffContent, setDiffContent] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState('');
  const [isBasicInfoModalVisible, setIsBasicInfoModalVisible] = useState(false);
  const [basicInfoForm] = Form.useForm();

  const { currentWorkspace } = useWorkspaceStore();

  // 获取模型列表
  const {
    loading: modelsLoading,
    data: modelOptions = [],
    run: loadModels
  } = useRequest(async () => {
    const models = await getModels();
    return models.map(m => ({
      label: m.name,
      value: m.id
    }));
  }, {
    manual: true
  });

  // 添加获取项目列表的请求
  const {
    loading: projectLoading,
    data: projectOptions = [],
    run: fetchProjects
  } = useRequest(async () => {
    const projects = await getProjects(currentWorkspace?.id);
    return projects.map(p => ({
      label: p.name,
      value: p.id
    }));
  }, {
    manual: true,
    initialData: []
  });

  // 获取提示词详情和历史记录
  const {
    loading: initLoading,
    run: initializePrompt
  } = useRequest(async () => {
    try {
      // 如果从列表页传递了提示词名称，直接使用
      if (location.state?.promptName) {
        setPromptName(location.state.promptName);
      }

      // 1. 获取历史记录列表
      const history = await getPromptHistory(id);
      if (!history || history.length === 0) {
        message.error('获取提示词历史失败');
        return;
      }
      setHistoryVersions(history);

      // 2. 确定要显示的版本
      let targetVersion;
      if (location.state?.historyVersion) {
        // 从历史记录页面进入，显示指定版本
        targetVersion = location.state.historyVersion;
      } else {
        // 正常编辑模式，显示最新版本
        targetVersion = history[0].version;
      }

      // 3. 获取版本详情
      const versionDetail = await getPromptHistoryVersion(id, targetVersion);
      if (!location.state?.promptName) {
        // 如果没有传递提示词名称，则使用版本详情中的名称
        setPromptName(versionDetail.name);
      }
      setSelectedVersion(targetVersion);
      form.setFieldsValue({
        name: versionDetail.name,
        content: versionDetail.content
      });

      if (location.state?.historyVersion) {
        setIsFromHistory(true);
      }
    } catch (error) {
      console.error('Failed to initialize prompt:', error);
      message.error('获取提示词信息失败');
    }
  }, {
    manual: true
  });

  // 添加获取提示词详情的请求
  const {
    run: getPromptDetail
  } = useRequest(async () => {
    const response = await getPromptById(id);
    return response;
  }, {
    manual: true
  });

  // 调用模型的简单处理函数
  const handleCallModel = () => {
    message.info('暂不可用，敬请期待');
  };

  // 在组件挂载时初始化
  useEffect(() => {
    if (id) {
      initializePrompt();
      loadModels();
      fetchProjects();
    }
  }, [id, initializePrompt, loadModels, fetchProjects]);

  // 处理表单提交前的差异比较
  const handleFormSubmit = async (values) => {
    try {
      // 获取最新版本的内容
      const history = await getPromptHistory(id);
      if (history && history.length > 0) {
        const latestVersion = history[0].version;
        const versionDetail = await getPromptHistoryVersion(id, latestVersion);
        
        // 直接计算差异，不需要保存最新内容
        const differences = diffLines(versionDetail.content, values.content);
        setDiffContent(differences);

        // 显示差异对比弹窗
        setIsDiffModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to compare versions:', error);
      message.error('获取版本对比失败');
    }
  };

  // 处理最终提交
  const handleFinalSubmit = async () => {
    try {
      const { message: commitMessage } = await messageForm.validateFields();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const values = form.getFieldsValue();
      
      await updatePrompt(id, {
        ...values,
        projectId: projectId ? Number(projectId) : values.projectId,
        status: 1,
        updateUserId: currentUser.id,
        message: commitMessage
      });

      message.success('更新成功！');
      navigate(-1);
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 渲染差异内容
  const renderDiff = useCallback((differences) => {
    return differences.map((part, index) => {
      let color = '#000';
      let backgroundColor = 'transparent';
      let prefix = '  ';
      
      if (part.added) {
        color = '#28a745';
        backgroundColor = '#e6ffec';
        prefix = '+ ';
      } else if (part.removed) {
        color = '#d73a49';
        backgroundColor = '#ffeef0';
        prefix = '- ';
      }

      return (
        <div 
          key={index} 
          style={{ 
            color,
            backgroundColor,
            padding: '2px 0',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}
        >
          {prefix}{part.value}
        </div>
      );
    });
  }, []);

  // 处理史版本选择
  const handleVersionSelect = async (version) => {
    if (!version) {
      // 如果清除选择，恢复到最新版本
      const latestVersion = historyVersions[0]?.version;
      if (latestVersion) {
        try {
          const versionDetail = await getPromptHistoryVersion(id, latestVersion);
          setSelectedVersion(latestVersion);
          form.setFieldsValue({
            content: versionDetail.content
          });
          setIsFromHistory(false);
        } catch (error) {
          console.error('Failed to fetch latest version:', error);
          message.error('获取最新版本失败');
        }
      }
      return;
    }

    try {
      const versionDetail = await getPromptHistoryVersion(id, version);
      setSelectedVersion(version);
      form.setFieldsValue({
        content: versionDetail.content
      });
      setIsFromHistory(true);
    } catch (error) {
      console.error('Failed to fetch version detail:', error);
      message.error('获取版本内容失败');
    }
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/prompts?projectId=${projectId}`);
    } else if (workspaceId) {
      navigate(`/prompts?workspaceId=${workspaceId}`);
    } else if (currentWorkspace) {
      navigate('/prompts');
    } else {
      navigate('/prompts');
    }
  };

  const handleFullscreenOpen = () => {
    const content = form.getFieldValue('content');
    setFullscreenContent(content || '');
    setIsFullscreen(true);
  };

  return (
    <>
      <Card
        title={
          <Space>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ paddingLeft: 0 }}
            >
              返回列表
            </Button>
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              {promptName || '加载中...'}
              {selectedVersion && ` - V${selectedVersion}`}
              {isFromHistory && ' (历史版本)'}
            </span>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={async () => {
                try {
                  // 先确保项目列表已加载
                  if (projectOptions.length === 0) {
                    await fetchProjects();
                  }
                  
                  // 获取当前提示词的完整信息
                  const promptDetail = await getPromptDetail();
                  
                  // 设置表单的初始值
                  basicInfoForm.setFieldsValue({
                    name: promptDetail.name,
                    projectId: promptDetail.projectId // 使用当前提示词的项目ID
                  });
                  
                  setIsBasicInfoModalVisible(true);
                } catch (error) {
                  console.error('Failed to get prompt details:', error);
                  message.error('获取提示词信息失败');
                }
              }}
            />
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="选择模型"
              options={modelOptions}
              loading={modelsLoading}
              disabled
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleCallModel}
            >
              调用模型
            </Button>
          </Space>
        }
      >
        <Spin spinning={initLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >

            <Form.Item label="历史版本">
              <Select
                value={selectedVersion}
                onChange={handleVersionSelect}
                loading={initLoading}
                placeholder="选择历史版本"
                allowClear
                style={{ width: '100%' }}
                optionLabelProp="label"
              >
                {historyVersions.map(history => (
                  <Select.Option 
                    key={history.version}
                    value={history.version}
                    label={`V${history.version} - ${history.message || '更新提示词'}`}
                  >
                    <div>
                      <div>V{history.version} - {history.message || '更新提示词'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {history.username} 于 {formatDate(history.createTime)}
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label={
                <Space>
                  提示词内容
                  <Button 
                    type="link" 
                    icon={<FullscreenOutlined />} 
                    onClick={(e) => {
                      e.preventDefault(); // 防止表单提交
                      handleFullscreenOpen();
                    }}
                  />
                </Space>
              }
              rules={[{ required: true, message: '请输入提示词内容！' }]}
            >
              <TextArea rows={25} placeholder="请输入提示词内容" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleBack}>
                  取消
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={initLoading}
                >
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>

      <Modal
        title="请输入修改备注"
        open={isMessageModalVisible}
        onOk={handleFinalSubmit}
        onCancel={() => {
          setIsMessageModalVisible(false);
          messageForm.resetFields();
        }}
        confirmLoading={initLoading}
      >
        <Form
          form={messageForm}
          layout="vertical"
        >
          <Form.Item
            name="message"
            rules={[{ required: true, message: '请输入修改备注！' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入本次修改的说明，如：优化提示词描述"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="内容变更对比"
        open={isDiffModalVisible}
        width={1000}
        footer={null}
        onCancel={() => {
          setIsDiffModalVisible(false);
          messageForm.resetFields();
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <span>变更说明：</span>
              <span style={{ color: '#28a745' }}>+ 新增</span>
              <span style={{ color: '#d73a49' }}>- 删除</span>
            </Space>
          </div>
          <div style={{ 
            maxHeight: '400px', 
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: '#fafafa'
          }}>
            {diffContent && renderDiff(diffContent)}
          </div>
        </div>

        <Form
          form={messageForm}
          layout="vertical"
        >
          <Form.Item
            name="message"
            label="版本备注"
            rules={[{ required: true, message: '请输入版本备注！' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入本次修改的说明，如：优化提示词描述"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsDiffModalVisible(false);
                messageForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" onClick={handleFinalSubmit}>
                确认提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提示词内容"
        open={isFullscreen}
        onCancel={() => setIsFullscreen(false)}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Space key="footer">
            <Button onClick={() => setIsFullscreen(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={() => {
                form.setFieldsValue({ content: fullscreenContent });
                setIsFullscreen(false);
              }}
            >
              确定
            </Button>
          </Space>
        ]}
      >
        <Input.TextArea
          value={fullscreenContent}
          onChange={(e) => setFullscreenContent(e.target.value)}
          style={{ 
            height: 'calc(90vh - 150px)',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '12px',
            resize: 'none'
          }}
          autoFocus
        />
      </Modal>

      <Modal
        title="编辑基本信息"
        open={isBasicInfoModalVisible}
        onCancel={() => setIsBasicInfoModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBasicInfoModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              basicInfoForm.validateFields().then(async (values) => {
                try {
                  await updatePromptBasicInfo(id, {
                    name: values.name,
                    projectId: values.projectId,
                    message: '更新基本信息'
                  });
                  message.success('更新成功！');
                  setPromptName(values.name);
                  setIsBasicInfoModalVisible(false);
                  // 如果修改了项目，需要返回到新的项目页面
                  if (values.projectId !== projectId) {
                    navigate(`/prompts?projectId=${values.projectId}`);
                  }
                } catch (error) {
                  message.error('更新失败');
                }
              });
            }}
          >
            确定
          </Button>
        ]}
      >
        <Form
          form={basicInfoForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="提示词名称"
            rules={[{ required: true, message: '请输入提示词名称！' }]}
          >
            <Input placeholder="请输入提示词名称" />
          </Form.Item>

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
        </Form>
      </Modal>
    </>
  );
};

export default PromptEdit; 