package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_outcomes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;

    @Column(name = "outcome")
    private String outcome;   // ACCEPTED | IGNORED | PENDING
}
