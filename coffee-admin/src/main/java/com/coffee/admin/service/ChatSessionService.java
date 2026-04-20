package com.coffee.admin.service;

import com.coffee.admin.dto.SessionDetailDTO;
import com.coffee.admin.dto.SessionUpdateRequest;
import com.coffee.admin.model.*;
import com.coffee.admin.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatSessionService {

    private final ChatSessionRepo       sessionRepo;
    private final ChatMessageRepo       messageRepo;
    private final RecommendationOutcomeRepo outcomeRepo;

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Transactional
    public ChatSession createSession(String sessionId) {
        if (sessionRepo.existsById(sessionId)) {
            return sessionRepo.findById(sessionId).get();
        }
        ChatSession session = ChatSession.builder()
                .sessionId(sessionId)
                .startedAt(LocalDateTime.now())
                .status("OPEN")
                .outcome("NO_ACTION")
                .messageCount(0)
                .build();
        return sessionRepo.save(session);
    }

    @Transactional
    public ChatMessage addMessage(String sessionId, String sender, String message) {
        // Ensure session exists
        if (!sessionRepo.existsById(sessionId)) createSession(sessionId);

        ChatMessage msg = ChatMessage.builder()
                .sessionId(sessionId)
                .sender(sender)
                .message(message)
                .sentAt(LocalDateTime.now())
                .build();
        messageRepo.save(msg);

        // Update session metadata
        sessionRepo.findById(sessionId).ifPresent(s -> {
            s.setMessageCount((s.getMessageCount() == null ? 0 : s.getMessageCount()) + 1);
            s.setLastMessageAt(LocalDateTime.now());
            sessionRepo.save(s);
        });

        return msg;
    }

    @Transactional
    public RecommendationOutcome logRecommendation(String sessionId, Integer productId, String productName) {
        RecommendationOutcome outcome = RecommendationOutcome.builder()
                .sessionId(sessionId)
                .productId(productId)
                .productName(productName)
                .recommendedAt(LocalDateTime.now())
                .outcome("PENDING")
                .build();
        // Mark session outcome
        sessionRepo.findById(sessionId).ifPresent(s -> {
            s.setOutcome("RECOMMENDED");
            sessionRepo.save(s);
        });
        return outcomeRepo.save(outcome);
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    public List<ChatSession> getAllSessions() {
        return sessionRepo.findAllByOrderByStartedAtDesc();
    }

    public List<ChatSession> getSessionsByStatus(String status) {
        return sessionRepo.findByStatusOrderByStartedAtDesc(status);
    }

    public Optional<ChatSession> getSession(String sessionId) {
        return sessionRepo.findById(sessionId);
    }

    public SessionDetailDTO getSessionDetail(String sessionId) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        List<ChatMessage> messages = messageRepo.findBySessionIdOrderBySentAtAsc(sessionId);
        List<RecommendationOutcome> outcomes = outcomeRepo.findBySessionId(sessionId);
        return SessionDetailDTO.from(session, messages, outcomes);
    }

    public List<ChatMessage> getMessages(String sessionId) {
        return messageRepo.findBySessionIdOrderBySentAtAsc(sessionId);
    }

    public Map<String, Object> getStats() {
        long total       = sessionRepo.count();
        long open        = sessionRepo.countOpenSessions();
        long recommended = sessionRepo.countRecommendedSessions();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalSessions",       total);
        stats.put("openSessions",        open);
        stats.put("recommendedSessions", recommended);
        stats.put("closedSessions",      total - open);
        return stats;
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @Transactional
    public ChatSession updateSession(String sessionId, SessionUpdateRequest req) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        if (req.getStatus()     != null) session.setStatus(req.getStatus());
        if (req.getOutcome()    != null) session.setOutcome(req.getOutcome());
        if (req.getAdminNotes() != null) session.setAdminNotes(req.getAdminNotes());
        // Auto-set endedAt when closing
        if ("CLOSED".equals(req.getStatus()) || "ARCHIVED".equals(req.getStatus())) {
            if (session.getEndedAt() == null) session.setEndedAt(LocalDateTime.now());
        }
        return sessionRepo.save(session);
    }

    @Transactional
    public RecommendationOutcome updateOutcome(Long outcomeId, String outcome) {
        RecommendationOutcome ro = outcomeRepo.findById(outcomeId)
                .orElseThrow(() -> new RuntimeException("Outcome not found: " + outcomeId));
        ro.setOutcome(outcome);
        return outcomeRepo.save(ro);
    }

    @Transactional
    public void closeSession(String sessionId) {
        sessionRepo.findById(sessionId).ifPresent(s -> {
            s.setStatus("CLOSED");
            s.setEndedAt(LocalDateTime.now());
            sessionRepo.save(s);
        });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteSession(String sessionId) {
        messageRepo.deleteBySessionId(sessionId);
        outcomeRepo.deleteBySessionId(sessionId);
        sessionRepo.deleteById(sessionId);
        log.info("Deleted session: {}", sessionId);
    }

    @Transactional
    public void deleteAllSessions() {
        outcomeRepo.deleteAll();
        messageRepo.deleteAll();
        sessionRepo.deleteAll();
        log.info("All sessions deleted.");
    }

    @Transactional
    public void deleteMessage(Long messageId) {
        messageRepo.deleteById(messageId);
        log.info("Deleted message: {}", messageId);
    }
}
