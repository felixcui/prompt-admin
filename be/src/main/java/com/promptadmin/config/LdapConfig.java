package com.promptadmin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class LdapConfig {
    
    @Value("${spring.ldap.urls}")
    private String ldapUrl;
    
    @Value("${spring.ldap.base}")
    private String ldapBase;
    
    @Value("${spring.ldap.username}")
    private String ldapUsername;
    
    @Value("${spring.ldap.password}")
    private String ldapPassword;

    @Bean
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl(ldapUrl);
        contextSource.setBase(ldapBase);
        contextSource.setUserDn(ldapUsername);
        contextSource.setPassword(ldapPassword);
        
        contextSource.setReferral("follow");
        contextSource.afterPropertiesSet();
        
        return contextSource;
    }

    @Bean
    public LdapTemplate ldapTemplate() {
        LdapTemplate template = new LdapTemplate(contextSource());
        template.setIgnorePartialResultException(true);
        return template;
    }
} 