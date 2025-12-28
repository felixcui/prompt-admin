package com.promptadmin.controller.request;

import lombok.Data;

@Data
public class PromptBasicInfoUpdateRequest {
    private String name;
    private Long projectId;
    private String message;
} 