package com.coffee.admin.controller;

import com.coffee.admin.dto.*;
import com.coffee.admin.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final ChatbotService   chatbotService;
    private final TrendService     trendService;
    private final AnalyticsService analyticsService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req) {
        if (req.getMessage() == null || req.getMessage().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Please enter a message.", req.getSessionId()));
        }
        return ResponseEntity.ok(chatbotService.chat(req.getMessage(), req.getSessionId()));
    }

    @DeleteMapping("/chat/{sessionId}")
    public ResponseEntity<Map<String, String>> clearChat(@PathVariable String sessionId) {
        chatbotService.clearHistory(sessionId);
        return ResponseEntity.ok(Map.of("status", "cleared"));
    }

    @PostMapping("/trends/recalculate")
    public ResponseEntity<Map<String, Object>> recalculate() {
        try {
            trendService.recalculateAll();
            return ResponseEntity.ok(Map.of("status", "success",
                    "message", "Trend scores recalculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/trends/popular")
    public ResponseEntity<List<TrendDTO>> popular() {
        return ResponseEntity.ok(trendService.getBestsellers());
    }

    @GetMapping("/trends/growing")
    public ResponseEntity<List<TrendDTO>> growing() {
        return ResponseEntity.ok(trendService.getTrendingUp());
    }

    @GetMapping("/recommendations/trending")
    public ResponseEntity<List<TrendDTO>> trendingRecommendations() {
        return ResponseEntity.ok(trendService.getTop10());
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> stats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }
}
