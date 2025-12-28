package com.promptadmin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.promptadmin.common.BusinessException;
import com.promptadmin.entity.User;
import com.promptadmin.entity.Workspace;
import com.promptadmin.entity.WorkspaceMember;
import com.promptadmin.entity.Project;
import com.promptadmin.entity.PromptHistory;
import com.promptadmin.entity.Prompt;
import com.promptadmin.mapper.ProjectMapper;
import com.promptadmin.mapper.UserMapper;
import com.promptadmin.mapper.WorkspaceMapper;
import com.promptadmin.mapper.WorkspaceMemberMapper;
import com.promptadmin.mapper.PromptHistoryMapper;
import com.promptadmin.mapper.PromptMapper;
import com.promptadmin.service.WorkspaceService;
import com.promptadmin.dto.WorkspaceMemberDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@Service
public class WorkspaceServiceImpl implements WorkspaceService {

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private WorkspaceMapper workspaceMapper;

    @Autowired
    private WorkspaceMemberMapper workspaceMemberMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PromptHistoryMapper promptHistoryMapper;

    @Autowired
    private PromptMapper promptMapper;

    @Override
    public List<Workspace> getUserWorkspaces(Long userId) {
        // 先查询用户角色
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 如果是超级管理员，返回所有工作空间
        List<Workspace> workspaces;
        if ("superadmin".equals(user.getRole())) {
            workspaces = workspaceMapper.selectList(
                new QueryWrapper<Workspace>()
                    .eq("status", 1)
            );
        } else {
            // 获取用户作为成员的工作空间ID列表
            List<Long> memberWorkspaceIds = workspaceMemberMapper.selectList(
                new QueryWrapper<WorkspaceMember>()
                    .eq("user_id", userId)
            ).stream().map(WorkspaceMember::getWorkspaceId).collect(Collectors.toList());

            if (memberWorkspaceIds.isEmpty()) {
                return new ArrayList<>();
            }

            // 获取用户作为成员的工作空间
            workspaces = workspaceMapper.selectList(
                new QueryWrapper<Workspace>()
                    .in("id", memberWorkspaceIds)
                    .eq("status", 1)
            );
        }

        // 获取所有管理员的用户信息
        List<Long> adminIds = workspaces.stream()
            .map(Workspace::getAdminId)
            .distinct()
            .collect(Collectors.toList());

        Map<Long, User> adminMap = userMapper.selectList(
            new QueryWrapper<User>()
                .in("id", adminIds)
        ).stream().collect(Collectors.toMap(User::getId, u -> u));

        // 设置管理员名称
        workspaces.forEach(workspace -> {
            User admin = adminMap.get(workspace.getAdminId());
            if (admin != null) {
                workspace.setAdminName(admin.getUsername());
            }
        });

        return workspaces;
    }

    @Override
    @Transactional
    public Workspace createWorkspace(Workspace workspace) {
        workspace.setStatus(1); // 默认启用
        workspaceMapper.insert(workspace);
        
        // 自动将管理员添加为成员
        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspaceId(workspace.getId());
        member.setUserId(workspace.getAdminId());
        workspaceMemberMapper.insert(member);
        
        return workspace;
    }

    @Override
    public Workspace updateWorkspace(Workspace workspace) {
        Workspace existingWorkspace = workspaceMapper.selectById(workspace.getId());
        if (existingWorkspace == null) {
            throw new BusinessException("工作空间不存在");
        }
        
        workspaceMapper.updateById(workspace);
        return workspace;
    }

    @Override
    @Transactional
    public void deleteWorkspace(Long id) {
        // 1. 获取工作空间下的所有项目
        List<Project> projects = projectMapper.selectList(
            new QueryWrapper<Project>()
                .eq("workspace_id", id)
        );
        
        // 2. 删除每个项目下的所有提示词历史记录和提示词
        for (Project project : projects) {
            // 2.1 删除提示词历史记录
            promptHistoryMapper.delete(
                new QueryWrapper<PromptHistory>()
                    .inSql("prompt_id", 
                        "SELECT id FROM prompts WHERE project_id = " + project.getId())
            );
            
            // 2.2 删除提示词
            promptMapper.delete(
                new QueryWrapper<Prompt>()
                    .eq("project_id", project.getId())
            );
        }
        
        // 3. 删除工作空间下的所有项目
        projectMapper.delete(
            new QueryWrapper<Project>()
                .eq("workspace_id", id)
        );
        
        // 4. 删除工作空间的所有成员关系
        workspaceMemberMapper.delete(
            new QueryWrapper<WorkspaceMember>()
                .eq("workspace_id", id)
        );
        
        // 5. 删除工作空间本身
        workspaceMapper.deleteById(id);
    }

    @Override
    public void addWorkspaceMember(Long workspaceId, Long userId) {
        // 检查是否已经是成员
        if (isWorkspaceMember(workspaceId, userId)) {
            throw new BusinessException("用户已经是工作空间成员");
        }
        
        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspaceId(workspaceId);
        member.setUserId(userId);
        workspaceMemberMapper.insert(member);
    }

    @Override
    public void removeWorkspaceMember(Long workspaceId, Long userId) {
        // 检查是否是管理员
        Workspace workspace = workspaceMapper.selectById(workspaceId);
        if (workspace != null && workspace.getAdminId().equals(userId)) {
            throw new BusinessException("不能移除工作空间管理员");
        }
        
        workspaceMemberMapper.delete(
            new QueryWrapper<WorkspaceMember>()
                .eq("workspace_id", workspaceId)
                .eq("user_id", userId)
        );
    }

    @Override
    public List<WorkspaceMemberDTO> getWorkspaceMembers(Long workspaceId) {
        // 获取成员ID列表
        List<WorkspaceMember> members = workspaceMemberMapper.selectList(
            new QueryWrapper<WorkspaceMember>()
                .eq("workspace_id", workspaceId)
        );

        // 转换为DTO
        return members.stream().map(member -> {
            User user = userMapper.selectById(member.getUserId());
            WorkspaceMemberDTO dto = new WorkspaceMemberDTO();
            if (user != null) {
                dto.setId(user.getId());
                dto.setUsername(user.getUsername());
                dto.setEmail(user.getEmail());
                dto.setRole(user.getRole());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public boolean isWorkspaceMember(Long workspaceId, Long userId) {
        // 检查是否是管理员
        Workspace workspace = workspaceMapper.selectById(workspaceId);
        if (workspace != null && workspace.getAdminId().equals(userId)) {
            return true;
        }
        
        // 检查是否是成员
        return workspaceMemberMapper.selectCount(
            new QueryWrapper<WorkspaceMember>()
                .eq("workspace_id", workspaceId)
                .eq("user_id", userId)
        ) > 0;
    }

    @Override
    public Workspace getWorkspaceById(Long id) {
        Workspace workspace = workspaceMapper.selectById(id);
        if (workspace == null) {
            throw new BusinessException("工作空间不存在");
        }
        return workspace;
    }
} 