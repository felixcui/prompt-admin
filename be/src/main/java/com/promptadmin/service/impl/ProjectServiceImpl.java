package com.promptadmin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.promptadmin.common.BusinessException;
import com.promptadmin.entity.Project;
import com.promptadmin.entity.User;
import com.promptadmin.entity.Workspace;
import com.promptadmin.mapper.ProjectMapper;
import com.promptadmin.service.ProjectService;
import com.promptadmin.service.UserService;
import com.promptadmin.service.WorkspaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserService userService;

    @Override
    public List<Project> getWorkspaceProjects(Long workspaceId) {
        return projectMapper.selectList(
            new QueryWrapper<Project>()
                .eq("workspace_id", workspaceId)
                .eq("status", 1)
        );
    }

    @Override
    public List<Project> getUserProjects(Long userId) {
        // 获取用户有权限的工作空间
        List<Workspace> workspaces = workspaceService.getUserWorkspaces(userId);
        if (workspaces.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取这些工作空间下的所有项目
        List<Long> workspaceIds = workspaces.stream()
            .map(Workspace::getId)
            .collect(Collectors.toList());

        return projectMapper.selectList(
            new QueryWrapper<Project>()
                .in("workspace_id", workspaceIds)
                .eq("status", 1)
        );
    }

    @Override
    @Transactional
    public Project createProject(Project project) {
        // 验证用户是否有权限在该工作空间创建项目
        if (!workspaceService.isWorkspaceMember(project.getWorkspaceId(), project.getCreateUserId())) {
            throw new BusinessException("没有权限在此工作空间创建项目");
        }

        project.setStatus(1); // 默认启用
        projectMapper.insert(project);
        return project;
    }

    @Override
    public Project updateProject(Project project) {
        Project existingProject = projectMapper.selectById(project.getId());
        if (existingProject == null) {
            throw new BusinessException("项目不存在");
        }

        // 验证用户是否有权限更新项目
        if (!hasProjectPermission(project.getUpdateUserId(), project.getId())) {
            throw new BusinessException("没有权限更新此项目");
        }

        projectMapper.updateById(project);
        return project;
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException("项目不存在");
        }

        // 逻辑删除项目
        project.setStatus(0);
        projectMapper.updateById(project);
    }

    @Override
    public Project getProjectById(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null || project.getStatus() != 1) {
            throw new BusinessException("项目不存在或已被删除");
        }
        return project;
    }

    @Override
    public boolean hasProjectPermission(Long userId, Long projectId) {
        // 超级管理员不受权限限制
        User user = userService.getUserById(userId);
        if (user != null && "superadmin".equals(user.getRole())) {
            return true;
        }

        Project project = getProjectById(projectId);
        if (project == null) {
            return false;
        }

        // 检查用户是否是工作空间成员
        return workspaceService.isWorkspaceMember(project.getWorkspaceId(), userId);
    }
} 