package com.coffee.admin.dto;

import com.coffee.admin.model.ChatMessage;
import com.coffee.admin.model.ChatSession;
import com.coffee.admin.model.RecommendationOutcome;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailDTO {
    private String sessionId;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String status;
    private String outcome;
    private String adminNotes;
    private Integer messageCount;
    private List<ChatMessage> messages;
    private List<RecommendationOutcome> recommendations;

    public static SessionDetailDTO from(ChatSession s,
                                        List<ChatMessage> messages,
                                        List<RecommendationOutcome> outcomes) {
        return SessionDetailDTO.builder()
                .sessionId(s.getSessionId())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .status(s.getStatus())
                .outcome(s.getOutcome())
                .adminNotes(s.getAdminNotes())
                .messageCount(s.getMessageCount())
                .messages(messages)
                .recommendations(outcomes)
                .build();
    }
}

