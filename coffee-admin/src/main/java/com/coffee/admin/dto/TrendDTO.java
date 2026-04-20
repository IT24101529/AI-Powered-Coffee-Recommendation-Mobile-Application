package com.coffee.admin.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDTO {
    private Integer productId;
    private String productName;
    private String productCategory;
    private Integer salesLast7d;
    private Integer salesLast30d;
    private Double growthRate;
    private Double trendScore;
    private String tier;

    public String getTierBadgeClass() {
        if (tier == null) return "badge-secondary";
        return switch (tier) {
            case "BESTSELLER"   -> "badge-bestseller";
            case "TRENDING_UP"  -> "badge-trending";
            case "HIDDEN_GEM"   -> "badge-gem";
            case "SEASONAL"     -> "badge-seasonal";
            default             -> "badge-secondary";
        };
    }

    public String getTierLabel() {
        if (tier == null) return "Normal";
        return switch (tier) {
            case "BESTSELLER"  -> "⭐ Bestseller";
            case "TRENDING_UP" -> "📈 Trending Up";
            case "HIDDEN_GEM"  -> "💎 Hidden Gem";
            case "SEASONAL"    -> "🌸 Seasonal";
            default            -> "Normal";
        };
    }
}
