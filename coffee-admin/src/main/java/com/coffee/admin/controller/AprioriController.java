package com.coffee.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/apriori")
public class AprioriController {
    @GetMapping
    public String aprioriPage(Model model) {
        model.addAttribute("activeTab", "apriori");
        return "admin/apriori";
    }
}
