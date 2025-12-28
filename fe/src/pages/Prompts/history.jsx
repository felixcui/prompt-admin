import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, message, Modal, Tag } from 'antd';
import { ArrowLeftOutlined, DiffOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import { useRequest } from '../../hooks/useRequest';
import { getPromptHistory, getPromptById, getPromptHistoryVersion } from '../../services/api';
import { formatDate } from '../../utils';
import useWorkspaceStore from '../../stores/workspaceStore';
import { diffLines } from 'diff';

const PromptHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { projectId, workspaceId } = location.state || {};
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [isDiffModalVisible, setIsDiffModalVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const { currentWorkspace } = useWorkspaceStore();

  const {
    data: promptDetail,
    run: fetchPromptDetail
  } = useRequest(async () => {
    return await getPromptById(id);
  });

  const {
    loading: historyLoading,
    data: historyList,
    run: fetchHistory
  } = useRequest(async () => {
    const history = await getPromptHistory(id);
    if (history && history.length > 0) {
      setLatestVersion(history[0].version);
    }
    return history;
  });

  useEffect(() => {
    if (id) {
      fetchPromptDetail();
      fetchHistory();
    }
  }, [id, fetchPromptDetail, fetchHistory]);

  const handleCompare = useCallback(async () => {
    if (selectedVersions.length !== 2) {
      message.warning('请选择两个版本进行对比');
      return;
    }

    try {
      const [oldVersion, newVersion] = await Promise.all([
        getPromptHistoryVersion(id, selectedVersions[0].version),
        getPromptHistoryVersion(id, selectedVersions[1].version)
      ]);

      if (!oldVersion?.content || !newVersion?.content) {
        message.error('获取版本内容失败');
        return;
      }

      setSelectedVersions([
        { ...selectedVersions[0], content: oldVersion.content },
        { ...selectedVersions[1], content: newVersion.content }
      ]);
      
      setIsDiffModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch version details:', error);
      message.error('获取版本内容失败');
    }
  }, [selectedVersions, id]);

  const handleBack = useCallback(() => {
    if (projectId) {
      navigate(`/prompts?projectId=${projectId}`);
    } else if (workspaceId) {
      navigate(`/prompts?workspaceId=${workspaceId}`);
    } else if (currentWorkspace) {
      navigate('/prompts');
    } else {
      navigate('/prompts');
    }
  }, [navigate, projectId, workspaceId, currentWorkspace]);

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: '10%',
      render: (text) => `V${text}`,
    },
    {
      title: '备注信息',
      dataIndex: 'message',
      key: 'message',
      width: '25%',
      render: (text) => (
        <Tag color={text === '初始版本' ? 'green' : 'blue'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '提交用户',
      dataIndex: 'username',
      key: 'username',
      width: '15%',
      render: (text) => (
        <Tag color="purple">{text}</Tag>
      ),
    },
    {
      title: '修改时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '20%',
      render: (text) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      width: '40%',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleView(record.version)}
          >
            查看
          </Button>
          {record.version !== latestVersion && (
            <Button
              type="link"
              onClick={() => handleView(record.version)}
            >
              恢复此版本
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getDiff = (oldContent, newContent) => {
    if (!oldContent || !newContent) {
      return [];
    }

    const differences = diffLines(oldContent || '', newContent || '');
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

      return {
        content: part.value || '',
        style: { color, backgroundColor },
        prefix,
        key: index
      };
    });
  };

  // 查看版本内容
  const handleView = async (version) => {
    try {
      const versionDetail = await getPromptHistoryVersion(id, version);
      navigate(`/prompts/${id}`, {
        state: { 
          historyVersion: version,
          historyContent: versionDetail.content,
          historyMessage: versionDetail.message,
          historyUsername: versionDetail.username,
          historyCreateTime: versionDetail.createTime,
          promptName: promptDetail?.name,
          projectId,
          workspaceId 
        }
      });
    } catch (error) {
      console.error('Failed to fetch version detail:', error);
      message.error('获取版本内容失败');
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            {promptDetail?.name} - 历史版本
          </span>
        </Space>
        <Button
          type="primary"
          icon={<DiffOutlined />}
          onClick={handleCompare}
          disabled={selectedVersions.length !== 2}
        >
          对比选中版本
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={historyList}
        loading={historyLoading}
        rowKey="version"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedVersions.map(v => v.version),
          onChange: (_, selectedRows) => setSelectedVersions(selectedRows),
          max: 2,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title="版本对比"
        open={isDiffModalVisible}
        onCancel={() => setIsDiffModalVisible(false)}
        width={1200}
        footer={[
          <Button key="copy" onClick={() => {
            if (selectedVersions[1]?.content) {
              navigator.clipboard.writeText(selectedVersions[1].content);
              message.success('已复制到剪贴板');
            }
          }}>
            复制内容
          </Button>,
          <Button key="close" onClick={() => setIsDiffModalVisible(false)}>
            关闭
          </Button>
        ]}
        style={{ top: 20 }}
      >
        {selectedVersions.length === 2 && selectedVersions[0]?.content && selectedVersions[1]?.content && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <span>旧版本：V{selectedVersions[0].version}</span>
                  <span>({formatDate(selectedVersions[0].createTime)})</span>
                  <Tag color="blue">{selectedVersions[0].message}</Tag>
                  <Tag color="purple">提交用户：{selectedVersions[0].username}</Tag>
                </Space>
                <Space>
                  <span>新版本：V{selectedVersions[1].version}</span>
                  <span>({formatDate(selectedVersions[1].createTime)})</span>
                  <Tag color="blue">{selectedVersions[1].message}</Tag>
                  <Tag color="purple">提交用户：{selectedVersions[1].username}</Tag>
                </Space>
              </Space>
            </div>
            <div style={{ display: 'flex', height: 'calc(100vh - 300px)', minHeight: '400px' }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>变更对比：</div>
                <div 
                  style={{ 
                    backgroundColor: '#f6f8fa',
                    padding: '12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    height: 'calc(100% - 30px)'
                  }}
                >
                  {getDiff(selectedVersions[0].content, selectedVersions[1].content).map(part => (
                    <div 
                      key={part.key} 
                      style={{ 
                        ...part.style,
                        padding: '2px 0'
                      }}
                    >
                      {part.prefix}{part.content}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, marginLeft: 8 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>新版本完整内容：</div>
                <Editor
                  height="calc(100% - 30px)"
                  defaultLanguage="plaintext"
                  value={selectedVersions[1].content}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PromptHistory; 