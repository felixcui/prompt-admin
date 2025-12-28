package com.promptadmin.service;

import com.promptadmin.entity.Model;
import java.util.List;

public interface ModelService {
    List<Model> getModels();
    Model getModelById(Long id);
    Model createModel(Model model);
    Model updateModel(Model model);
    void deleteModel(Long id);
    String callModel(Long id, String prompt);
} 