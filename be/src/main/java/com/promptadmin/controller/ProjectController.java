package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.Project;
import com.promptadmin.entity.User;
import com.promptadmin.service.ProjectService;
import com.promptadmin.service.UserService;
import com.promptadmin.utils.LogUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public Result<List<Project>> getProjects(
            @RequestParam(required = false) Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ProjectController.getProjects", workspaceId, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (workspaceId != null) {
            return Result.success(projectService.getWorkspaceProjects(workspaceId));
        }
        return Result.success(projectService.getUserProjects(user.getId()));
    }

    @GetMapping("/detail/{id}")
    public Result<Project> getProject(@PathVariable Long id) {
        LogUtils.logRequest("ProjectController.getProject", id);
        return Result.success(projectService.getProjectById(id));
    }

    @PostMapping("/create")
    public Result<Project> createProject(
            @RequestBody Project project,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ProjectController.createProject", project, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        project.setCreateUserId(user.getId());
        project.setUpdateUserId(user.getId());
        return Result.success(projectService.createProject(project));
    }

    @PostMapping("/{id}/update")
    public Result<Project> updateProject(
            @PathVariable Long id,
            @RequestBody Project project,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ProjectController.updateProject", id, project, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        project.setId(id);
        project.setUpdateUserId(user.getId());
        return Result.success(projectService.updateProject(project));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> deleteProject(@PathVariable Long id) {
        LogUtils.logRequest("ProjectController.deleteProject", id);
        projectService.deleteProject(id);
        return Result.success(null);
    }
} 