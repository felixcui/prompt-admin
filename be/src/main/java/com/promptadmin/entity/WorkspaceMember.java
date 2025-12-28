package com.promptadmin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("workspace_members")
public class WorkspaceMember {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long workspaceId;
    private Long userId;
    private LocalDateTime createTime;
} 