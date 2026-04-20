package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "status")
    private String status;       // OPEN | CLOSED | ARCHIVED

    @Column(name = "outcome")
    private String outcome;      // RECOMMENDED | BROWSED | NO_ACTION

    @Column(name = "admin_notes", length = 2000)
    private String adminNotes;

    @Column(name = "message_count")
    private Integer messageCount;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
}
