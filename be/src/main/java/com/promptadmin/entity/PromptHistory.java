package com.promptadmin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("prompt_histories")
public class PromptHistory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long promptId;
    private Integer version;
    private String content;
    private String message;
    private Long userId;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
} 