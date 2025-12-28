package com.promptadmin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.promptadmin.entity.Project;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
    // ... 其他方法 ...

    @Delete("DELETE FROM projects WHERE workspace_id = #{workspaceId}")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
} 