package com.promptadmin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.promptadmin.common.BusinessException;
import com.promptadmin.entity.Model;
import com.promptadmin.mapper.ModelMapper;
import com.promptadmin.service.ModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModelServiceImpl implements ModelService {

    @Autowired
    private ModelMapper modelMapper;

    @Override
    public List<Model> getModels() {
        return modelMapper.selectList(
            new QueryWrapper<Model>()
                .eq("status", 1)
        );
    }

    @Override
    public Model getModelById(Long id) {
        Model model = modelMapper.selectById(id);
        if (model == null || model.getStatus() != 1) {
            throw new BusinessException("模型不存在或已被禁用");
        }
        return model;
    }

    @Override
    public Model createModel(Model model) {
        model.setStatus(1);
        modelMapper.insert(model);
        return model;
    }

    @Override
    public Model updateModel(Model model) {
        Model existingModel = modelMapper.selectById(model.getId());
        if (existingModel == null) {
            throw new BusinessException("模型不存在");
        }
        modelMapper.updateById(model);
        return model;
    }

    @Override
    public void deleteModel(Long id) {
        Model model = modelMapper.selectById(id);
        if (model == null) {
            throw new BusinessException("模型不存在");
        }
        model.setStatus(0);
        modelMapper.updateById(model);
    }

    @Override
    public String callModel(Long id, String prompt) {
        Model model = getModelById(id);
        // TODO: 实现实际的模型调用逻辑
        return "模型响应内容";
    }
} 