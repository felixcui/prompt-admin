package com.promptadmin.controller;

import com.promptadmin.common.Result;
import com.promptadmin.entity.User;
import com.promptadmin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public Result<List<User>> getUsers(@AuthenticationPrincipal UserDetails userDetails) {
        // 获取当前用户
        User currentUser = userService.getUserByUsername(userDetails.getUsername());
        // // 只有超级管理员可以获取用户列表
        // if (!"superadmin".equals(currentUser.getRole())) {
        //     return Result.error("没有权限获取用户列表");
        // }
        return Result.success(userService.getUsers());
    }
} 