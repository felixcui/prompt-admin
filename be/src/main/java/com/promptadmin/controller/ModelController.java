package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.Model;
import com.promptadmin.entity.User;
import com.promptadmin.service.ModelService;
import com.promptadmin.service.UserService;
import com.promptadmin.controller.request.ModelCallRequest;
import com.promptadmin.utils.LogUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/models")
public class ModelController {

    @Autowired
    private ModelService modelService;

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public Result<List<Model>> getModels() {
        LogUtils.logRequest("ModelController.getModels");
        return Result.success(modelService.getModels());
    }

    @GetMapping("/detail/{id}")
    public Result<Model> getModel(@PathVariable Long id) {
        LogUtils.logRequest("ModelController.getModel", id);
        return Result.success(modelService.getModelById(id));
    }

    @PostMapping("/create")
    public Result<Model> createModel(
            @RequestBody Model model,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ModelController.createModel", model, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以创建模型");
        }
        return Result.success(modelService.createModel(model));
    }

    @PostMapping("/{id}/update")
    public Result<Model> updateModel(
            @PathVariable Long id,
            @RequestBody Model model,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ModelController.updateModel", id, model, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以修改模型");
        }
        model.setId(id);
        return Result.success(modelService.updateModel(model));
    }

    @PostMapping("/{id}/delete")
    public Result<Void> deleteModel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        LogUtils.logRequest("ModelController.deleteModel", id, userDetails.getUsername());
        User user = userService.getUserByUsername(userDetails.getUsername());
        if (!"superadmin".equals(user.getRole())) {
            return Result.error("只有超级管理员可以删除模型");
        }
        modelService.deleteModel(id);
        return Result.success(null);
    }

    @PostMapping("/{id}/call")
    public Result<String> callModel(
            @PathVariable Long id,
            @RequestBody ModelCallRequest request) {
        LogUtils.logRequest("ModelController.callModel", id, request);
        return Result.success(modelService.callModel(id, request.getPrompt()));
    }
} 