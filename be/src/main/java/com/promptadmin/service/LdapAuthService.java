package com.promptadmin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.filter.Filter;
import org.springframework.stereotype.Service;

@Service
public class LdapAuthService {
    
    private static final Logger log = LoggerFactory.getLogger(LdapAuthService.class);
    
    @Autowired
    private LdapTemplate ldapTemplate;

    @Value("${spring.ldap.group}")
    private String ldapGroup;

    public boolean authenticate(String username, String password) {
        if (username == null || username.trim().isEmpty() || 
            password == null || password.trim().isEmpty()) {
            log.warn("Username or password is empty");
            return false;
        }

        try {
            AndFilter filter = new AndFilter();
            filter.and(new EqualsFilter("objectclass", "person"))
                  .and(new EqualsFilter("sAMAccountName", username));

            log.debug("Attempting LDAP authentication for user: {}", username);
            boolean result = ldapTemplate.authenticate("", filter.encode(), password);
            log.debug("LDAP authentication result for user {}: {}", username, result);
            return result;
        } catch (Exception e) {
            log.error("LDAP authentication error for user: " + username, e);
            return false;
        }
    }
} 