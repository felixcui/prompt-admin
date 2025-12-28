package com.promptadmin.service;

import com.promptadmin.entity.Workspace;
import com.promptadmin.mapper.WorkspaceMapper;
import com.promptadmin.mapper.WorkspaceMemberMapper;
import com.promptadmin.mapper.ProjectMapper;
import com.promptadmin.dto.WorkspaceMemberDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface WorkspaceService {

    /**
     * 获取用户的工作空间列表
     */
    List<Workspace> getUserWorkspaces(Long userId);

    /**
     * 创建工作空间
     */
    Workspace createWorkspace(Workspace workspace);

    /**
     * 更新工作空间
     */
    Workspace updateWorkspace(Workspace workspace);

    /**
     * 删除工作空间及其关联数据
     */
    @Transactional
    void deleteWorkspace(Long id);

    /**
     * 添加工作空间成员
     */
    void addWorkspaceMember(Long workspaceId, Long userId);

    /**
     * 移除工作空间成员
     */
    void removeWorkspaceMember(Long workspaceId, Long userId);

    /**
     * 获取工作空间成员列表
     */
    List<WorkspaceMemberDTO> getWorkspaceMembers(Long workspaceId);

    /**
     * 检查用户是否是工作空间成员
     */
    boolean isWorkspaceMember(Long workspaceId, Long userId);

    /**
     * 根据ID获取工作空间
     */
    Workspace getWorkspaceById(Long id);
}