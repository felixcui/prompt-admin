package com.promptadmin.dto;

import lombok.Data;

@Data
public class WorkspaceMemberDTO {
    private Long id;          // 用户ID
    private String username;  // 用户名
    private String email;     // 邮箱
    private String role;      // 角色
} 