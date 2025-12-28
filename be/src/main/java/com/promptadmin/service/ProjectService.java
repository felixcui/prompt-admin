package com.promptadmin.service;

import com.promptadmin.entity.Project;
import java.util.List;

public interface ProjectService {
    List<Project> getWorkspaceProjects(Long workspaceId);
    List<Project> getUserProjects(Long userId);
    Project createProject(Project project);
    Project updateProject(Project project);
    void deleteProject(Long id);
    Project getProjectById(Long id);
    boolean hasProjectPermission(Long userId, Long projectId);
} 