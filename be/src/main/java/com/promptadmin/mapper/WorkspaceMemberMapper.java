package com.promptadmin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.promptadmin.entity.WorkspaceMember;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WorkspaceMemberMapper extends BaseMapper<WorkspaceMember> {
    
    @Delete("DELETE FROM workspace_members WHERE workspace_id = #{workspaceId}")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
} 