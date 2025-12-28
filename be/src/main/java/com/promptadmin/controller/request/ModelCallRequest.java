package com.promptadmin.controller.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class ModelCallRequest extends BaseRequest {
    private String prompt;
} 