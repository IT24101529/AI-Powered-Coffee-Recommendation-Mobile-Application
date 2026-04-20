package com.coffee.admin.controller;

import com.coffee.admin.dto.*;
import com.coffee.admin.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class DashboardController {

    private final AnalyticsService   analyticsService;
    private final TrendService       trendService;
    private final ChatSessionService chatSessionService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        DashboardStats stats = analyticsService.getDashboardStats();
        model.addAttribute("stats", stats);
        model.addAttribute("activeTab", "dashboard");
        return "admin/dashboard";
    }

    @GetMapping("/trends")
    public String trends(Model model,
                         @RequestParam(defaultValue = "all") String filter) {
        List<TrendDTO> list = switch (filter) {
            case "bestseller" -> trendService.getBestsellers();
            case "trending"   -> trendService.getTrendingUp();
            case "hidden_gem" -> trendService.getHiddenGems();
            default           -> trendService.getAllTrends();
        };
        model.addAttribute("trends", list);
        model.addAttribute("filter", filter);
        model.addAttribute("top10",  trendService.getTop10());
        model.addAttribute("activeTab", "trends");
        return "admin/trends";
    }

    @GetMapping("/chatbot")
    public String chatbot(Model model) {
        model.addAttribute("activeTab", "chatbot");
        return "admin/chatbot";
    }

    @GetMapping("/products")
    public String products(Model model) {
        model.addAttribute("activeTab", "products");
        return "admin/products";
    }
}
