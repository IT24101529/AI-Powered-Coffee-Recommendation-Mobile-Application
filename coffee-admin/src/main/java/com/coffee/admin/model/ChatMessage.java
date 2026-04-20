package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "sender")   // "admin" or "bot"
    private String sender;

    @Column(name = "message", length = 5000)
    private String message;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
