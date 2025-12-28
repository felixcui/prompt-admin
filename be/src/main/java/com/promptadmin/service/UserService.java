package com.promptadmin.service;

import com.promptadmin.entity.User;

import java.util.List;

public interface UserService {
    User getUserByUsername(String username);
    User getUserById(Long id);
    User createUser(User user);
    User updateUser(User user);
    void deleteUser(Long id);
    String login(String username, String password);
    List<User> getUsers();
} 