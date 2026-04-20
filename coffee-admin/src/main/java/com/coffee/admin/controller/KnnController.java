package com.coffee.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/knn")
public class KnnController {
    @GetMapping
    public String knnPage(Model model) {
        model.addAttribute("activeTab", "knn");
        return "admin/knn";
    }
}
