package com.promptadmin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("models")
public class Model {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String apiUrl;
    private String apiKey;
    private Integer status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
} 