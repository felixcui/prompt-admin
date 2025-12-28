package com.promptadmin.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PromptHistoryDTO {
    private Long id;
    private Long promptId;
    private Integer version;
    private String content;
    private String message;
    private Long userId;
    private String username;
    private LocalDateTime createTime;
} 