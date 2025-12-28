package com.promptadmin.controller.request;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class RegisterRequest extends BaseRequest {
    private String username;
    private String password;
    private String email;
} 