package com.promptadmin.controller.request;

import com.promptadmin.entity.Prompt;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class PromptUpdateRequest extends BaseRequest {
    private Prompt prompt;
    private String message;
} 