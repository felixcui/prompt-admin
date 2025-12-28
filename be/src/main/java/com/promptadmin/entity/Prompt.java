package com.promptadmin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("prompts")
public class Prompt {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String content;
    private Long projectId;
    private Integer status;
    private Long createUserId;
    private Long updateUserId;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    
    @TableField(exist = false)
    private String projectName;
} 