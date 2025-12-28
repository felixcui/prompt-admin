package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.User;
import com.promptadmin.service.UserService;
import com.promptadmin.controller.request.LoginRequest;
import com.promptadmin.controller.request.RegisterRequest;
import com.promptadmin.utils.LogUtils;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        LogUtils.logRequest("AuthController.login", request.getUsername());
        String token = userService.login(request.getUsername(), request.getPassword());
        User user = userService.getUserByUsername(request.getUsername());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        log.info("Login successful for user: {}, token: {}", user.getUsername(), token);

        return Result.success(result);
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody RegisterRequest request) {
        LogUtils.logRequest("AuthController.register", request);
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());
        user.setRole("user");  // 默认注册为普通用户
        return Result.success(userService.createUser(user));
    }
} 