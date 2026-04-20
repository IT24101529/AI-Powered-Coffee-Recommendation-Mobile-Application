package com.coffee.admin.controller;

import com.coffee.admin.dto.*;
import com.coffee.admin.model.*;
import com.coffee.admin.service.ChatSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// ── Page Controller ───────────────────────────────────────────────────────────
@Controller
@RequestMapping("/admin/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final ChatSessionService sessionService;

    @GetMapping
    public String sessionsPage(Model model,
                               @RequestParam(defaultValue = "all") String filter) {
        List<ChatSession> sessions = filter.equals("all")
                ? sessionService.getAllSessions()
                : sessionService.getSessionsByStatus(filter.toUpperCase());
        model.addAttribute("sessions", sessions);
        model.addAttribute("filter",   filter);
        model.addAttribute("stats",    sessionService.getStats());
        model.addAttribute("activeTab", "sessions");
        return "admin/sessions";
    }

    @GetMapping("/{sessionId}")
    public String sessionDetail(@PathVariable String sessionId, Model model) {
        SessionDetailDTO detail = sessionService.getSessionDetail(sessionId);
        model.addAttribute("detail",    detail);
        model.addAttribute("activeTab", "sessions");
        return "admin/session-detail";
    }
}

// ── REST API Controller ───────────────────────────────────────────────────────
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
class SessionApiController {

    private final ChatSessionService sessionService;

    // CREATE
    @PostMapping
    public ResponseEntity<ChatSession> createSession(@RequestBody Map<String, String> body) {
        String sessionId = body.getOrDefault("sessionId", "session-" + System.currentTimeMillis());
        return ResponseEntity.ok(sessionService.createSession(sessionId));
    }

    @PostMapping("/{sessionId}/messages")
    public ResponseEntity<ChatMessage> addMessage(@PathVariable String sessionId,
                                                   @RequestBody Map<String, String> body) {
        String sender  = body.getOrDefault("sender", "admin");
        String message = body.get("message");
        if (message == null || message.isBlank())
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(sessionService.addMessage(sessionId, sender, message));
    }

    @PostMapping("/{sessionId}/recommendations")
    public ResponseEntity<RecommendationOutcome> logRecommendation(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> body) {
        Integer productId   = (Integer) body.get("productId");
        String  productName = (String)  body.get("productName");
        return ResponseEntity.ok(sessionService.logRecommendation(sessionId, productId, productName));
    }

    // READ
    @GetMapping
    public ResponseEntity<List<ChatSession>> getAllSessions(
            @RequestParam(defaultValue = "all") String filter) {
        List<ChatSession> list = filter.equals("all")
                ? sessionService.getAllSessions()
                : sessionService.getSessionsByStatus(filter.toUpperCase());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(sessionService.getStats());
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionDetailDTO> getSession(@PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(sessionService.getSessionDetail(sessionId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String sessionId) {
        return ResponseEntity.ok(sessionService.getMessages(sessionId));
    }

    @GetMapping("/{sessionId}/replay")
    public ResponseEntity<SessionDetailDTO> replaySession(@PathVariable String sessionId) {
        try {
            return ResponseEntity.ok(sessionService.getSessionDetail(sessionId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // UPDATE
    @PutMapping("/{sessionId}")
    public ResponseEntity<ChatSession> updateSession(@PathVariable String sessionId,
                                                      @RequestBody SessionUpdateRequest req) {
        try {
            return ResponseEntity.ok(sessionService.updateSession(sessionId, req));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/outcomes/{outcomeId}")
    public ResponseEntity<RecommendationOutcome> updateOutcome(@PathVariable Long outcomeId,
                                                                @RequestBody Map<String, String> body) {
        String outcome = body.get("outcome");
        if (outcome == null) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(sessionService.updateOutcome(outcomeId, outcome));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{sessionId}/close")
    public ResponseEntity<Map<String, String>> closeSession(@PathVariable String sessionId) {
        sessionService.closeSession(sessionId);
        return ResponseEntity.ok(Map.of("status", "closed"));
    }

    // DELETE
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteSession(@PathVariable String sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAllSessions() {
        sessionService.deleteAllSessions();
        return ResponseEntity.ok(Map.of("status", "all deleted"));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Map<String, String>> deleteMessage(@PathVariable Long messageId) {
        sessionService.deleteMessage(messageId);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
