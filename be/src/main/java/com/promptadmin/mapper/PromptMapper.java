package com.promptadmin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.promptadmin.entity.Prompt;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PromptMapper extends BaseMapper<Prompt> {
} 