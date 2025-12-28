package com.promptadmin.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

@Slf4j
public class LogUtils {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static void logRequest(String methodName, Object... args) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            StringBuilder logMessage = new StringBuilder();
            logMessage.append("\n================== Request Start ==================\n");
            logMessage.append("URI         : ").append(request.getRequestURI()).append("\n");
            logMessage.append("Method      : ").append(request.getMethod()).append("\n");
            logMessage.append("Controller  : ").append(methodName).append("\n");
            
            if (args != null && args.length > 0) {
                logMessage.append("Parameters  : ");
                for (Object arg : args) {
                    if (arg != null) {
                        logMessage.append(objectMapper.writeValueAsString(arg)).append(" ");
                    }
                }
                logMessage.append("\n");
            }
            
            logMessage.append("================== Request End ====================");
            log.info(logMessage.toString());
        } catch (Exception e) {
            log.error("Error logging request", e);
        }
    }
} 