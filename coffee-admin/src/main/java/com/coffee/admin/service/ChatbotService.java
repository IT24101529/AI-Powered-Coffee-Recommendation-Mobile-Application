package com.coffee.admin.service;

import com.coffee.admin.dto.ChatResponse;
import com.coffee.admin.model.ChatMessage;
import com.coffee.admin.model.Product;
import com.coffee.admin.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule-based chatbot that answers natural-language queries about sales data.
 * Implements FR5.7 – sales insight Q&A.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final SalesReceiptRepo salesReceiptRepo;
    private final ProductRepo       productRepo;
    private final TrendScoreRepo    trendScoreRepo;
    private final ChatMessageRepo   chatMessageRepo;
    private final TrendService      trendService;
    @Lazy
    private final ChatSessionService chatSessionService;

    @Transactional
    public ChatResponse chat(String userMessage, String sessionId) {
        // Ensure session exists and track messages via session service
        chatSessionService.createSession(sessionId);
        chatSessionService.addMessage(sessionId, "admin", userMessage);

        String reply = buildReply(userMessage.toLowerCase().trim());

        chatSessionService.addMessage(sessionId, "bot", reply);

        return new ChatResponse(reply, sessionId);
    }

    public List<ChatMessage> getHistory(String sessionId) {
        return chatMessageRepo.findBySessionIdOrderBySentAtAsc(sessionId);
    }

    @Transactional
    public void clearHistory(String sessionId) {
        chatSessionService.deleteSession(sessionId);
    }

    // ── Intent Router ─────────────────────────────────────────────────────────

    private String buildReply(String msg) {
        // Greetings
        if (matchesAny(msg, "hello", "hi", "hey", "good morning", "good afternoon")) {
            return "☕ Hello! I'm your Coffee Analytics Assistant. Ask me about sales, trends, top products, revenue, or outlets. What would you like to know?";
        }

        // Help
        if (matchesAny(msg, "help", "what can you", "commands", "options")) {
            return helpMessage();
        }

        // Revenue queries
        if (matchesAny(msg, "revenue", "total sales", "how much", "earned", "income", "money")) {
            return revenueAnswer(msg);
        }

        // Top products
        if (matchesAny(msg, "top product", "best selling", "bestseller", "most sold", "popular product")) {
            return topProductsAnswer(msg);
        }

        // Trending
        if (matchesAny(msg, "trending", "trend", "trending up", "growing", "growth")) {
            return trendingAnswer();
        }

        // Hidden gems
        if (matchesAny(msg, "hidden gem", "underrated", "low awareness", "undiscovered")) {
            return hiddenGemsAnswer();
        }

        // Transactions
        if (matchesAny(msg, "transaction", "orders", "order count", "how many orders")) {
            return transactionAnswer();
        }

        // Customers
        if (matchesAny(msg, "customer", "unique customer", "how many customer")) {
            return customerAnswer();
        }

        // Busiest time / hour
        if (matchesAny(msg, "busiest", "peak hour", "peak time", "what time", "busy hour")) {
            return busiestHourAnswer();
        }

        // Category
        if (matchesAny(msg, "category", "categories", "product type", "beverage", "food", "coffee")) {
            return categoryAnswer(msg);
        }

        // Outlet / store
        if (matchesAny(msg, "outlet", "store", "location", "branch")) {
            return outletAnswer();
        }

        // Promotions
        if (matchesAny(msg, "promo", "promotion", "discount", "offer")) {
            return promoAnswer();
        }

        // Date range
        if (matchesAny(msg, "date", "period", "range", "when", "month", "april")) {
            return dateRangeAnswer();
        }

        // Items sold
        if (matchesAny(msg, "item", "quantity", "units sold", "items sold")) {
            return itemsAnswer();
        }

        // Default
        return "🤔 I didn't quite understand that. Try asking about:\n" +
               "• **Top selling products** — \"What are the best selling products?\"\n" +
               "• **Revenue** — \"What is the total revenue?\"\n" +
               "• **Trending items** — \"What's trending?\"\n" +
               "• **Peak hours** — \"When is the busiest time?\"\n" +
               "• **Outlets** — \"Which outlet performs best?\"\n\n" +
               "Type **help** for a full list.";
    }

    // ── Intent handlers ───────────────────────────────────────────────────────

    private String revenueAnswer(String msg) {
        Double rev = salesReceiptRepo.totalRevenue();
        Long txns  = salesReceiptRepo.totalTransactions();
        double avg  = (txns != null && txns > 0) ? rev / txns : 0;
        return String.format(
                "💰 **Total Revenue:** $%.2f\n" +
                "📦 **Total Transactions:** %,d\n" +
                "📊 **Average Order Value:** $%.2f\n\n" +
                "This covers all sales in the April 2019 dataset across all outlets.",
                rev, txns, avg);
    }

    private String topProductsAnswer(String msg) {
        List<Object[]> top = salesReceiptRepo.topProductsByQuantity();
        Map<Integer, String> names = buildProductNames();
        StringBuilder sb = new StringBuilder("🏆 **Top 5 Best-Selling Products:**\n\n");
        int rank = 1;
        for (Object[] row : top) {
            if (rank > 5) break;
            Integer pid = ((Number) row[0]).intValue();
            Long qty    = ((Number) row[1]).longValue();
            String name = names.getOrDefault(pid, "Product " + pid);
            sb.append(String.format("%d. **%s** — %,d units sold\n", rank++, name, qty));
        }
        return sb.toString();
    }

    private String trendingAnswer() {
        var trending = trendService.getTrendingUp();
        if (trending.isEmpty()) {
            return "📈 No trending products found yet. Try running a trend recalculation from the Trends tab.";
        }
        StringBuilder sb = new StringBuilder("📈 **Top Trending Products (30%+ Week-over-Week Growth):**\n\n");
        int rank = 1;
        for (var t : trending) {
            if (rank > 5) break;
            sb.append(String.format("%d. **%s** — Score: %.1f | Growth: +%.1f%%\n",
                    rank++, t.getProductName(), t.getTrendScore(), t.getGrowthRate()));
        }
        return sb.toString();
    }

    private String hiddenGemsAnswer() {
        var gems = trendService.getHiddenGems();
        if (gems.isEmpty()) {
            return "💎 No hidden gems identified yet. Try running a trend recalculation.";
        }
        StringBuilder sb = new StringBuilder("💎 **Hidden Gems (High Potential, Low Awareness):**\n\n");
        int rank = 1;
        for (var g : gems) {
            if (rank > 5) break;
            sb.append(String.format("%d. **%s** (%s) — Score: %.1f\n",
                    rank++, g.getProductName(), g.getProductCategory(), g.getTrendScore()));
        }
        sb.append("\n💡 _These products could benefit from increased promotion._");
        return sb.toString();
    }

    private String transactionAnswer() {
        Long txns     = salesReceiptRepo.totalTransactions();
        Long items    = salesReceiptRepo.totalItemsSold();
        Long customers = salesReceiptRepo.uniqueCustomers();
        return String.format(
                "📋 **Transaction Summary:**\n\n" +
                "• Total Orders: **%,d**\n" +
                "• Total Items Sold: **%,d**\n" +
                "• Unique Customers: **%,d**\n" +
                "• Avg Items per Order: **%.1f**",
                txns, items, customers, (double) items / txns);
    }

    private String customerAnswer() {
        Long customers = salesReceiptRepo.uniqueCustomers();
        List<Object[]> split = salesReceiptRepo.instoreVsOnline();
        long instore = 0, online = 0;
        for (Object[] row : split) {
            if ("Y".equalsIgnoreCase((String) row[0])) instore = ((Number) row[1]).longValue();
            else online = ((Number) row[1]).longValue();
        }
        return String.format(
                "👥 **Customer Insights:**\n\n" +
                "• Unique Customers: **%,d**\n" +
                "• In-store Visits: **%,d** transactions\n" +
                "• Online Orders: **%,d** transactions",
                customers, instore, online);
    }

    private String busiestHourAnswer() {
        List<Object[]> hourly = salesReceiptRepo.salesByHour();
        if (hourly.isEmpty()) return "No hourly data available.";
        Object[] peak = hourly.stream()
                .max(Comparator.comparingLong(r -> ((Number) r[1]).longValue()))
                .orElse(hourly.get(0));
        int    hr  = ((Number) peak[0]).intValue();
        long   cnt = ((Number) peak[1]).longValue();
        String ampm = hr < 12 ? "AM" : "PM";
        int    hr12 = hr > 12 ? hr - 12 : (hr == 0 ? 12 : hr);
        return String.format(
                "⏰ **Peak Sales Hour:**\n\n" +
                "• Busiest time: **%d:00 %s** with **%,d** transactions\n\n" +
                "💡 _This is the optimal time window to feature promotional items and limited-time offers._",
                hr12, ampm, cnt);
    }

    private String categoryAnswer(String msg) {
        List<Object[]> qtyRows = salesReceiptRepo.quantityPerProduct();
        Map<Integer, String> catMap = new HashMap<>();
        productRepo.findAll().forEach(p -> catMap.put(p.getProductId(), p.getProductCategory()));

        Map<String, Long> catTotals = new LinkedHashMap<>();
        for (Object[] row : qtyRows) {
            Integer pid = ((Number) row[0]).intValue();
            Long    qty = ((Number) row[1]).longValue();
            String  cat = catMap.getOrDefault(pid, "Other");
            catTotals.merge(cat, qty, Long::sum);
        }
        StringBuilder sb = new StringBuilder("☕ **Sales by Product Category:**\n\n");
        catTotals.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .forEach(e -> sb.append(String.format("• **%s**: %,d units\n", e.getKey(), e.getValue())));
        return sb.toString();
    }

    private String outletAnswer() {
        List<Object[]> outletRev = salesReceiptRepo.revenueByOutlet();
        StringBuilder sb = new StringBuilder("🏪 **Revenue by Outlet:**\n\n");
        outletRev.stream()
                .sorted((a, b) -> Double.compare(((Number) b[1]).doubleValue(), ((Number) a[1]).doubleValue()))
                .forEach(row -> {
                    Integer oid = ((Number) row[0]).intValue();
                    Double  rev = ((Number) row[1]).doubleValue();
                    sb.append(String.format("• **Outlet %d**: $%.2f\n", oid, rev));
                });
        return sb.toString();
    }

    private String promoAnswer() {
        return "🎁 **Promotional Items:**\n\nThe dataset tracks promotional items per transaction. " +
               "To maximize impact, focus promotions on **Hidden Gem** products during **peak hours**.\n\n" +
               "💡 _Tip: Use the A/B testing feature in the Trends tab to track promotion impact._";
    }

    private String dateRangeAnswer() {
        var min = salesReceiptRepo.minDate();
        var max = salesReceiptRepo.maxDate();
        return String.format(
                "📅 **Dataset Date Range:**\n\n" +
                "• **Start:** %s\n" +
                "• **End:** %s\n\n" +
                "All analytics are computed over this period (April 2019 sales data).",
                min, max);
    }

    private String itemsAnswer() {
        Long items = salesReceiptRepo.totalItemsSold();
        Long txns  = salesReceiptRepo.totalTransactions();
        return String.format(
                "📦 **Items Sold:**\n\n" +
                "• Total units sold: **%,d**\n" +
                "• Across **%,d** transactions\n" +
                "• Average items per transaction: **%.1f**",
                items, txns, (double) items / txns);
    }

    private String helpMessage() {
        return "🤖 **Coffee Analytics Chatbot — What I Can Answer:**\n\n" +
               "**Revenue & Sales**\n" +
               "• \"What is the total revenue?\"\n" +
               "• \"How many transactions were made?\"\n" +
               "• \"How many items were sold?\"\n\n" +
               "**Products & Trends**\n" +
               "• \"What are the best-selling products?\"\n" +
               "• \"What products are trending?\"\n" +
               "• \"Show me hidden gems\"\n" +
               "• \"Which category sells the most?\"\n\n" +
               "**Operations**\n" +
               "• \"When is the busiest time?\"\n" +
               "• \"Which outlet earns the most?\"\n" +
               "• \"How many unique customers are there?\"\n" +
               "• \"What is the date range of the data?\"\n\n" +
               "_Type any of these to get started!_";
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    private boolean matchesAny(String msg, String... keywords) {
        for (String kw : keywords) {
            if (msg.contains(kw)) return true;
        }
        return false;
    }

    private Map<Integer, String> buildProductNames() {
        Map<Integer, String> map = new HashMap<>();
        productRepo.findAll().forEach(p -> map.put(p.getProductId(), p.getProduct()));
        return map;
    }
}
