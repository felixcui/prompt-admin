package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.Prompt;
import com.promptadmin.entity.PromptHistory;
import com.promptadmin.entity.User;
import com.promptadmin.service.PromptService;
import com.promptadmin.service.UserService;
import com.promptadmin.controller.request.PromptBasicInfoUpdateRequest;
import com.promptadmin.controller.request.PromptUpdateRequest;
import com.promptadmin.dto.PromptHistoryDTO;
import com.promptadmin.utils.LogUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prompts")
public class PromptController {

    @Autowired
    private PromptService promptService;

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public Result<List<Prompt>> getPrompts(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("PromptController.getPrompts", projectId, workspaceId, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        
        if (projectId != null) {
            return Result.success(promptService.getProjectPrompts(projectId));
        } else if (workspaceId != null) {
            return Result.success(promptService.getWorkspacePrompts(workspaceId));
        } else {
            return Result.success(promptService.getUserPrompts(user.getId()));
        }
    }

    @GetMapping("/detail/{id}")
    public Result<Prompt> getPrompt(@PathVariable Long id) {
        LogUtils.logRequest("PromptController.getPrompt", id);
        return Result.success(promptService.getPromptById(id));
    }

    @PostMapping("/create")
    public Result<Prompt> createPrompt(
            @RequestBody Prompt prompt,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("PromptController.createPrompt", prompt, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        prompt.setCreateUserId(user.getId());
        prompt.setUpdateUserId(user.getId());
        return Result.success(promptService.createPrompt(prompt));
    }

    @PostMapping("/{id}/update")
    public Result<Prompt> updatePrompt(
            @PathVariable Long id,
            @RequestBody PromptUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("PromptController.updatePrompt", id, request, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        Prompt prompt = request.getPrompt();
        prompt.setId(id);
        return Result.success(promptService.updatePrompt(prompt, request.getMessage()));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> deletePrompt(@PathVariable Long id) {
        LogUtils.logRequest("PromptController.deletePrompt", id);
        promptService.deletePrompt(id);
        return Result.success(null);
    }

    @GetMapping("/{id}/history")
    public Result<List<PromptHistoryDTO>> getPromptHistory(@PathVariable Long id) {
        LogUtils.logRequest("PromptController.getPromptHistory", id);
        List<PromptHistoryDTO> history = promptService.getPromptHistory(id);
        return Result.success(history);
    }

    @GetMapping("/{id}/history/list")
    public Result<List<PromptHistoryDTO>> getPromptHistoryList(@PathVariable Long id) {
        LogUtils.logRequest("PromptController.getPromptHistoryList", id);
        List<PromptHistoryDTO> history = promptService.getPromptHistoryList(id);
        return Result.success(history);
    }

    @GetMapping("/{id}/history/{version}")
    public Result<PromptHistoryDTO> getPromptHistoryVersion(
            @PathVariable Long id,
            @PathVariable Integer version
    ) {
        LogUtils.logRequest("PromptController.getPromptHistoryVersion", id, version);
        PromptHistoryDTO history = promptService.getPromptHistoryVersion(id, version);
        return Result.success(history);
    }

    @PostMapping("/{id}/update-basic-info")
    public Result<Prompt> updatePromptBasicInfo(
            @PathVariable Long id,
            @RequestBody PromptBasicInfoUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("PromptController.updatePromptBasicInfo", id, request, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        return Result.success(promptService.updatePromptBasicInfo(id, request.getName(), request.getProjectId(), user.getId(), request.getMessage()));
    }
} 