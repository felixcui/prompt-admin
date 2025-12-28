package com.promptadmin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.promptadmin.common.BusinessException;
import com.promptadmin.entity.Prompt;
import com.promptadmin.entity.PromptHistory;
import com.promptadmin.entity.Project;
import com.promptadmin.entity.User;
import com.promptadmin.mapper.PromptMapper;
import com.promptadmin.mapper.PromptHistoryMapper;
import com.promptadmin.service.PromptService;
import com.promptadmin.service.ProjectService;
import com.promptadmin.service.UserService;
import com.promptadmin.dto.PromptHistoryDTO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PromptServiceImpl implements PromptService {

    @Autowired
    private PromptMapper promptMapper;

    @Autowired
    private PromptHistoryMapper promptHistoryMapper;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Override
    public List<Prompt> getProjectPrompts(Long projectId) {
        List<Prompt> prompts = promptMapper.selectList(
            new QueryWrapper<Prompt>()
                .eq("project_id", projectId)
                .eq("status", 1)
        );
        
        if (!prompts.isEmpty()) {
            Project project = projectService.getProjectById(projectId);
            if (project != null) {
                prompts.forEach(prompt -> {
                    prompt.setProjectName(project.getName());
                });
            }
        }
        
        return prompts;
    }

    @Override
    public List<Prompt> getUserPrompts(Long userId) {
        return promptMapper.selectList(
            new QueryWrapper<Prompt>()
                .eq("create_user_id", userId)
                .or()
                .eq("update_user_id", userId)
                .eq("status", 1)
        );
    }

    @Override
    @Transactional
    public Prompt createPrompt(Prompt prompt) {
        // 验证用户是否有权限在该项目创建提示词
        if (!projectService.hasProjectPermission(prompt.getCreateUserId(), prompt.getProjectId())) {
            throw new BusinessException("没有权限在此项目创建提示词");
        }

        prompt.setStatus(1); // 默认启用
        if (prompt.getUpdateUserId() == null) {
            prompt.setUpdateUserId(prompt.getCreateUserId());
        }
        promptMapper.insert(prompt);

        // 创建初始版本历史记录
        PromptHistory history = new PromptHistory();
        history.setPromptId(prompt.getId());
        history.setVersion(1);
        history.setContent(prompt.getContent());
        history.setMessage("初始版本");
        history.setUserId(prompt.getCreateUserId());
        promptHistoryMapper.insert(history);

        return prompt;
    }

    @Override
    @Transactional
    public Prompt updatePrompt(Prompt prompt, String message) {
        Prompt existingPrompt = promptMapper.selectById(prompt.getId());
        if (existingPrompt == null) {
            throw new BusinessException("提示词不存在");
        }

        // 验证用户是否有权限更新提示词
        if (!hasPromptPermission(prompt.getUpdateUserId(), prompt.getId())) {
            throw new BusinessException("没有权限更新此提示词");
        }

        // 获取当前最新版本号
        Integer latestVersion = promptHistoryMapper.selectOne(
            new QueryWrapper<PromptHistory>()
                .eq("prompt_id", prompt.getId())
                .orderByDesc("version")
                .last("LIMIT 1")
        ).getVersion();

        // 创建新的历史记录
        PromptHistory history = new PromptHistory();
        history.setPromptId(prompt.getId());
        history.setVersion(latestVersion + 1);
        history.setContent(prompt.getContent());
        history.setMessage(message);
        history.setUserId(prompt.getUpdateUserId());
        promptHistoryMapper.insert(history);

        // 更新提示词
        promptMapper.updateById(prompt);
        return prompt;
    }

    @Override
    @Transactional
    public void deletePrompt(Long id) {
        Prompt prompt = promptMapper.selectById(id);
        if (prompt == null) {
            throw new BusinessException("提示词不存在");
        }

        // 逻辑删除提示词
        prompt.setStatus(0);
        promptMapper.updateById(prompt);
    }

    @Override
    public Prompt getPromptById(Long id) {
        Prompt prompt = promptMapper.selectById(id);
        if (prompt == null || prompt.getStatus() != 1) {
            throw new BusinessException("提示词不存在或已被删除");
        }
        return prompt;
    }

    @Override
    public List<PromptHistoryDTO> getPromptHistory(Long promptId) {
        List<PromptHistory> histories = promptHistoryMapper.selectList(
            new QueryWrapper<PromptHistory>()
                .eq("prompt_id", promptId)
                .orderByDesc("version")
        );

        return histories.stream().map(history -> {
            PromptHistoryDTO dto = new PromptHistoryDTO();
            BeanUtils.copyProperties(history, dto);
            
            // 获取并设置用户名
            User user = userService.getUserById(history.getUserId());
            if (user != null) {
                dto.setUsername(user.getUsername());
            } else {
                dto.setUsername("未知用户");
            }
            
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public boolean hasPromptPermission(Long userId, Long promptId) {
        Prompt prompt = getPromptById(promptId);
        if (prompt == null) {
            return false;
        }

        // 检查用户是否有项目权限
        return projectService.hasProjectPermission(userId, prompt.getProjectId());
    }

    @Override
    public List<Prompt> getWorkspacePrompts(Long workspaceId) {
        // 获取工作空间下的所有项目
        List<Project> projects = projectService.getWorkspaceProjects(workspaceId);
        if (projects.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取这些项目下的所有提示词
        List<Long> projectIds = projects.stream()
            .map(Project::getId)
            .collect(Collectors.toList());

        List<Prompt> prompts = promptMapper.selectList(
            new QueryWrapper<Prompt>()
                .in("project_id", projectIds)
                .eq("status", 1)
                .orderByDesc("update_time")
        );

        // 创建项目ID到项目名称的映射
        Map<Long, String> projectMap = projects.stream()
            .collect(Collectors.toMap(Project::getId, Project::getName));

        // 设置项目名称
        prompts.forEach(prompt -> {
            prompt.setProjectName(projectMap.get(prompt.getProjectId()));
        });

        return prompts;
    }

    @Override
    public List<PromptHistoryDTO> getPromptHistoryList(Long promptId) {
        List<PromptHistory> histories = promptHistoryMapper.selectList(
            new QueryWrapper<PromptHistory>()
                .eq("prompt_id", promptId)
                .select("id", "prompt_id", "version", "user_id", "message", "create_time") // 不查询 content 字段
                .orderByDesc("version")
        );

        return histories.stream().map(history -> {
            PromptHistoryDTO dto = new PromptHistoryDTO();
            BeanUtils.copyProperties(history, dto);
            User user = userService.getUserById(history.getUserId());
            if (user != null) {
                dto.setUsername(user.getUsername());
            } else {
                dto.setUsername("未知用户");
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public PromptHistoryDTO getPromptHistoryVersion(Long promptId, Integer version) {
        PromptHistory history = promptHistoryMapper.selectOne(
            new QueryWrapper<PromptHistory>()
                .eq("prompt_id", promptId)
                .eq("version", version)
        );
        
        if (history == null) {
            throw new BusinessException("版本不存在");
        }

        PromptHistoryDTO dto = new PromptHistoryDTO();
        BeanUtils.copyProperties(history, dto);
        User user = userService.getUserById(history.getUserId());
        if (user != null) {
            dto.setUsername(user.getUsername());
        } else {
            dto.setUsername("未知用户");
        }
        return dto;
    }

    @Override
    @Transactional
    public Prompt updatePromptBasicInfo(Long id, String name, Long projectId, Long userId, String message) {
        Prompt prompt = getPromptById(id);
        if (prompt == null) {
            throw new BusinessException("提示词不存在");
        }

        // 验证用户是否有权限更新提示词
        if (!hasPromptPermission(userId, id)) {
            throw new BusinessException("没有权限更新此提示词");
        }

        // 验证新项目的权限
        if (!projectService.hasProjectPermission(userId, projectId)) {
            throw new BusinessException("没有权限将提示词移动到目标项目");
        }

        // 更新基本信息
        prompt.setName(name);
        prompt.setProjectId(projectId);
        prompt.setUpdateUserId(userId);
        promptMapper.updateById(prompt);

        return prompt;
    }
} 