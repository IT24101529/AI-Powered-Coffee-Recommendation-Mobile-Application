package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trend_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrendScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_category")
    private String productCategory;

    @Column(name = "sales_last_24h")
    private Integer salesLast24h;

    @Column(name = "sales_last_7d")
    private Integer salesLast7d;

    @Column(name = "sales_last_30d")
    private Integer salesLast30d;

    @Column(name = "growth_rate")
    private Double growthRate;      // % growth week-over-week

    @Column(name = "trend_score")
    private Double trendScore;      // (recent_sales*0.5) + (growth_rate*0.3) + (rating*0.2)

    @Column(name = "tier")
    private String tier;            // BESTSELLER | TRENDING_UP | SEASONAL | HIDDEN_GEM

    @Column(name = "computed_at")
    private LocalDateTime computedAt;
}
