package com.promptadmin.service;

import com.promptadmin.entity.Prompt;
import com.promptadmin.dto.PromptHistoryDTO;
import java.util.List;

public interface PromptService {
    List<Prompt> getProjectPrompts(Long projectId);
    List<Prompt> getWorkspacePrompts(Long workspaceId);
    List<Prompt> getUserPrompts(Long userId);
    Prompt createPrompt(Prompt prompt);
    Prompt updatePrompt(Prompt prompt, String message);
    void deletePrompt(Long id);
    Prompt getPromptById(Long id);
    
    // 添加新的接口方法
    List<PromptHistoryDTO> getPromptHistoryList(Long promptId);
    PromptHistoryDTO getPromptHistoryVersion(Long promptId, Integer version);
    
    // 原有的历史记录方法可以标记为过时
    @Deprecated
    List<PromptHistoryDTO> getPromptHistory(Long promptId);
    
    boolean hasPromptPermission(Long userId, Long promptId);
    
    // 在 PromptService 接口中添加新方法
    Prompt updatePromptBasicInfo(Long id, String name, Long projectId, Long userId, String message);
} 