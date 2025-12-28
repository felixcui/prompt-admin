package com.promptadmin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.promptadmin.mapper")
public class PromptAdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(PromptAdminApplication.class, args);
    }
} 