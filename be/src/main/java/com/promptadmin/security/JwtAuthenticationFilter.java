package com.promptadmin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.promptadmin.entity.User;
import com.promptadmin.service.UserService;

import io.jsonwebtoken.ExpiredJwtException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtils jwtUtils;
    private final UserService userService;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, UserService userService) {
        this.jwtUtils = jwtUtils;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        try {
            final String authHeader = request.getHeader("Authorization");
            log.debug("Auth header: {}", authHeader);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                chain.doFilter(request, response);
                return;
            }

            final String jwt = authHeader.substring(7);
            log.debug("Processing JWT token");
            
            // 检查 token 是否过期
            if (jwtUtils.isTokenExpired(jwt)) {
                log.warn("Token has expired: {}", jwt);
                handleAuthenticationError(response, "Token has expired");
                return;
            }

            Long userId = jwtUtils.extractUserId(jwt);
            log.debug("Extracted user ID: {}", userId);
            
            if (userId != null) {
                User user = userService.getUserById(userId);
                if (user != null) {
                    UserDetailsImpl userDetails = new UserDetailsImpl(user);
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authentication successful for user: {}", user.getUsername());
                } else {
                    log.warn("User not found for ID: {}", userId);
                }
            }
            
            chain.doFilter(request, response);
            
        } catch (ExpiredJwtException e) {
            log.error("JWT token has expired", e);
            handleAuthenticationError(response, "Token has expired");
        } catch (Exception e) {
            log.error("JWT Authentication failed:", e);
            handleAuthenticationError(response, "Authentication failed: " + e.getMessage());
        }
    }

    private void handleAuthenticationError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("code", 401);
        errorResponse.put("message", message);
        
        String jsonResponse = new ObjectMapper().writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }
} 