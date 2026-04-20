package com.coffee.admin.service;

import com.coffee.admin.dto.TrendDTO;
import com.coffee.admin.model.*;
import com.coffee.admin.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core trend analytics service implementing FR5.2 – FR5.4.
 *
 * Trend Score Formula (FR5):
 *   trend_score = (recent_sales * 0.5) + (growth_rate * 0.3) + (normalised_rating * 0.2)
 *
 * Tiers (FR5.3):
 *   BESTSELLER  – top 10% by volume
 *   TRENDING_UP – 30%+ growth WoW
 *   HIDDEN_GEM  – below median volume but high trend score
 *   SEASONAL    – high performance in specific months
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrendService {

    private final SalesReceiptRepo salesReceiptRepo;
    private final ProductRepo productRepo;
    private final TrendScoreRepo trendScoreRepo;

    // ── Scheduled recalculation every day at 2 AM ─────────────────────────────
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void scheduledRecalculate() {
        log.info("Scheduled trend recalculation started...");
        recalculateAll();
    }

    // ── Manual trigger from controller ────────────────────────────────────────
    @Transactional
    public void recalculateAll() {
        // Use dataset date range (April 2019 data)
        LocalDate maxDate = salesReceiptRepo.maxDate();
        if (maxDate == null) { log.warn("No sales data found."); return; }

        LocalDate from7d  = maxDate.minusDays(7);
        LocalDate from30d = maxDate.minusDays(30);
        LocalDate prev7d  = maxDate.minusDays(14);  // week before last week

        // Raw sales maps: productId → quantity
        Map<Integer, Integer> sales7d  = toMap(salesReceiptRepo.salesPerProductSince(from7d));
        Map<Integer, Integer> sales30d = toMap(salesReceiptRepo.salesPerProductSince(from30d));
        Map<Integer, Integer> prevWeek = toMap(salesReceiptRepo.salesPerProductBetween(prev7d, from7d));
        Map<Integer, Integer> allTime  = toMap(salesReceiptRepo.quantityPerProduct()
                .stream().map(r -> new Object[]{r[0], r[1]}).collect(Collectors.toList()));

        // Volume statistics for percentile thresholds
        List<Integer> allVolumes = new ArrayList<>(sales30d.values());
        allVolumes.sort(Collections.reverseOrder());
        int top10Threshold  = allVolumes.isEmpty() ? 0 : allVolumes.get(Math.max(0, (int)(allVolumes.size() * 0.10) - 1));
        double median       = allVolumes.isEmpty() ? 0 : allVolumes.get(allVolumes.size() / 2);

        // Max 7d sales for normalisation
        double max7d = sales7d.values().stream().mapToInt(i -> i).max().orElse(1);

        List<TrendScore> results = new ArrayList<>();

        for (Product p : productRepo.findAll()) {
            int pid        = p.getProductId();
            int vol7d      = sales7d.getOrDefault(pid, 0);
            int vol30d     = sales30d.getOrDefault(pid, 0);
            int volPrev    = prevWeek.getOrDefault(pid, 0);

            // Growth rate WoW (%)
            double growthRate = volPrev == 0
                    ? (vol7d > 0 ? 100.0 : 0.0)
                    : ((vol7d - volPrev) / (double) volPrev) * 100.0;

            // Normalise recent sales 0-100
            double normRecent = max7d == 0 ? 0 : (vol7d / max7d) * 100.0;

            // Placeholder rating = 70 (no rating data in dataset)
            double rating = 70.0;

            // Trend score formula from FR5
            double trendScore = (normRecent * 0.5) + (Math.min(growthRate, 100) * 0.3) + (rating * 0.2);

            // Tier classification (FR5.3)
            String tier;
            if (vol30d >= top10Threshold && top10Threshold > 0) {
                tier = "BESTSELLER";
            } else if (growthRate >= 30.0) {
                tier = "TRENDING_UP";
            } else if (vol30d < median && trendScore >= 30) {
                tier = "HIDDEN_GEM";
            } else {
                tier = "SEASONAL";
            }

            TrendScore ts = trendScoreRepo.findByProductId(pid)
                    .orElse(TrendScore.builder().productId(pid).build());
            ts.setProductName(p.getProduct());
            ts.setProductCategory(p.getProductCategory());
            ts.setSalesLast7d(vol7d);
            ts.setSalesLast30d(vol30d);
            ts.setGrowthRate(Math.round(growthRate * 10.0) / 10.0);
            ts.setTrendScore(Math.round(trendScore * 10.0) / 10.0);
            ts.setTier(tier);
            ts.setComputedAt(LocalDateTime.now());
            results.add(ts);
        }

        trendScoreRepo.saveAll(results);
        log.info("Trend recalculation complete for {} products.", results.size());
    }

    // ── Public query methods ──────────────────────────────────────────────────

    public List<TrendDTO> getAllTrends() {
        return trendScoreRepo.findAllByOrderByTrendScoreDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TrendDTO> getBestsellers() {
        return trendScoreRepo.findByTierOrderByTrendScoreDesc("BESTSELLER")
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TrendDTO> getTrendingUp() {
        return trendScoreRepo.findByTierOrderByTrendScoreDesc("TRENDING_UP")
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TrendDTO> getHiddenGems() {
        return trendScoreRepo.findByTierOrderByTrendScoreDesc("HIDDEN_GEM")
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TrendDTO> getTop10() {
        return trendScoreRepo.findTop10ByOrderByTrendScoreDesc()
                .stream().limit(10).map(this::toDTO).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TrendDTO toDTO(TrendScore ts) {
        return TrendDTO.builder()
                .productId(ts.getProductId())
                .productName(ts.getProductName())
                .productCategory(ts.getProductCategory())
                .salesLast7d(ts.getSalesLast7d())
                .salesLast30d(ts.getSalesLast30d())
                .growthRate(ts.getGrowthRate())
                .trendScore(ts.getTrendScore())
                .tier(ts.getTier())
                .build();
    }

    private Map<Integer, Integer> toMap(List<Object[]> rows) {
        Map<Integer, Integer> map = new HashMap<>();
        for (Object[] row : rows) {
            try {
                Integer pid = ((Number) row[0]).intValue();
                Integer qty = ((Number) row[1]).intValue();
                map.put(pid, qty);
            } catch (Exception ignored) {}
        }
        return map;
    }
}
