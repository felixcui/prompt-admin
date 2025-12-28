package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.User;
import com.promptadmin.entity.Workspace;
import com.promptadmin.service.UserService;
import com.promptadmin.service.WorkspaceService;
import com.promptadmin.utils.LogUtils;
import com.promptadmin.dto.WorkspaceMemberDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public Result<List<Workspace>> getUserWorkspaces(@AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.getUserWorkspaces", userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        return Result.success(workspaceService.getUserWorkspaces(user.getId()));
    }

    @PostMapping("/create")
    public Result<Workspace> createWorkspace(@RequestBody Workspace workspace, 
                                           @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.createWorkspace", workspace, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以创建工作空间");
        }
        return Result.success(workspaceService.createWorkspace(workspace));
    }

    @PostMapping("/{id}/update")
    public Result<Workspace> updateWorkspace(@PathVariable Long id,
                                           @RequestBody Workspace workspace,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.updateWorkspace", id, workspace, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以修改工作空间");
        }
        workspace.setId(id);
        return Result.success(workspaceService.updateWorkspace(workspace));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> deleteWorkspace(@PathVariable Long id,
                                      @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.deleteWorkspace", id, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以删除工作空间");
        }
        workspaceService.deleteWorkspace(id);
        return Result.success(null);
    }

    @GetMapping("/members/{id}")
    public Result<List<WorkspaceMemberDTO>> getWorkspaceMembers(@PathVariable Long id) {
        LogUtils.logRequest("WorkspaceController.getWorkspaceMembers", id);
        return Result.success(workspaceService.getWorkspaceMembers(id));
    }

    @PostMapping("/members/{id}/add")
    public Result<Void> addWorkspaceMembers(
            @PathVariable Long id,
            @RequestBody List<Long> memberIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.addWorkspaceMembers", id, memberIds, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        Workspace workspace = workspaceService.getWorkspaceById(id);
        
        if (!"superadmin".equals(user.getRole()) && !workspace.getAdminId().equals(user.getId())) {
            return Result.error("没有权限管理成员");
        }

        // 获取当前成员列表
        List<WorkspaceMemberDTO> existingMembers = workspaceService.getWorkspaceMembers(id);
        List<Long> existingMemberIds = existingMembers.stream()
            .map(WorkspaceMemberDTO::getId)
            .collect(Collectors.toList());

        // 添加新成员（排除已存在的成员）
        for (Long memberId : memberIds) {
            if (!existingMemberIds.contains(memberId)) {
                workspaceService.addWorkspaceMember(id, memberId);
            }
        }

        return Result.success(null);
    }

    @PostMapping("/members/{id}/remove")
    public Result<Void> removeWorkspaceMembers(
            @PathVariable Long id,
            @RequestBody List<Long> memberIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.removeWorkspaceMembers", id, memberIds, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        Workspace workspace = workspaceService.getWorkspaceById(id);
        
        if (!"superadmin".equals(user.getRole()) && !workspace.getAdminId().equals(user.getId())) {
            return Result.error("没有权限管理成员");
        }

        // 检查是否试图移除管理员
        if (memberIds.contains(workspace.getAdminId())) {
            return Result.error("不能移除工作空间管理员");
        }

        // 批量移除成员
        for (Long memberId : memberIds) {
            workspaceService.removeWorkspaceMember(id, memberId);
        }

        return Result.success(null);
    }

    @PostMapping("/members/{id}/update")
    public Result<Void> updateWorkspaceMembers(
            @PathVariable Long id,
            @RequestBody List<Long> memberIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("WorkspaceController.updateWorkspaceMembers", id, memberIds, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        Workspace workspace = workspaceService.getWorkspaceById(id);
        
        if (!"superadmin".equals(user.getRole()) && !workspace.getAdminId().equals(user.getId())) {
            return Result.error("没有权限管理成员");
        }

        // 确保管理员在成员列表中
        if (!memberIds.contains(workspace.getAdminId())) {
            memberIds.add(workspace.getAdminId());
        }

        // 删除所有现有成员
        List<WorkspaceMemberDTO> existingMembers = workspaceService.getWorkspaceMembers(id);
        for (WorkspaceMemberDTO member : existingMembers) {
            workspaceService.removeWorkspaceMember(id, member.getId());
        }

        // 添加新成员
        for (Long memberId : memberIds) {
            workspaceService.addWorkspaceMember(id, memberId);
        }

        return Result.success(null);
    }
} 