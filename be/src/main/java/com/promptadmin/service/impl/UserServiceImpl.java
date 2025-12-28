package com.promptadmin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.promptadmin.common.BusinessException;
import com.promptadmin.entity.User;
import com.promptadmin.mapper.UserMapper;
import com.promptadmin.security.JwtUtils;
import com.promptadmin.security.UserDetailsImpl;
import com.promptadmin.service.LdapAuthService;
import com.promptadmin.service.UserService;
import com.promptadmin.service.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private LdapAuthService ldapAuthService;

    @Autowired
    private WorkspaceService workspaceService;

    @Override
    public User getUserByUsername(String username) {
        return userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
    }

    @Override
    public User createUser(User user) {
        // 检查用户名是否已存在
        if (getUserByUsername(user.getUsername()) != null) {
            throw new BusinessException("用户名已存在");
        }
        
        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(1); // 默认启用
        
        userMapper.insert(user);
        return user;
    }

    @Override
    public User updateUser(User user) {
        User existingUser = userMapper.selectById(user.getId());
        if (existingUser == null) {
            throw new BusinessException("用户不存在");
        }
        
        // 如果修改了密码，需要重新加密
        if (user.getPassword() != null && !user.getPassword().equals(existingUser.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        userMapper.updateById(user);
        return user;
    }

    @Override
    public void deleteUser(Long id) {
        userMapper.deleteById(id);
    }

    @Override
    public String login(String username, String password) {
        if (username == null || username.trim().isEmpty()) {
            throw new BusinessException("用户名不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new BusinessException("密码不能为空");
        }

        // 使用LDAP进行认证
        if (!ldapAuthService.authenticate(username, password)) {
            throw new BusinessException("用户名或密码错误");
        }

        // 认证成功后，获取或创建本地用户
        User user = getUserByUsername(username);
        if (user == null) {
            // 如果是首次登录，创建本地用户记录
            log.info("首次登录，创建本地用户记录: {}", username); 
            user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole("user");
            user.setStatus(1);
            userMapper.insert(user);
            
            // 重新获取用户以获得生成的ID
            user = getUserByUsername(username);
            
            // 将新用户添加到 id=1 的工作空间
            try {
                workspaceService.addWorkspaceMember(1L, user.getId());
                log.info("已将新用户 {} 添加到工作空间 id=1", username);
            } catch (Exception e) {
                log.error("将新用户添加到工作空间时发生错误", e);
                // 这里我们捕获异常但不抛出，以确保即使添加工作空间失败，用户仍然可以登录
            }
        }

        // 生成JWT token
        return jwtUtils.generateToken(user.getId());
    }

    @Override
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }

    @Override
    public List<User> getUsers() {
        // 只返回未删除的用户
        return userMapper.selectList(
            new QueryWrapper<User>()
                .eq("status", 1)
        );
    }
} 