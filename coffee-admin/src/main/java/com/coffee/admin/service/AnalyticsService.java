package com.coffee.admin.service;

import com.coffee.admin.dto.DashboardStats;
import com.coffee.admin.model.Product;
import com.coffee.admin.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final SalesReceiptRepo salesReceiptRepo;
    private final ProductRepo productRepo;
    private final SalesOutletRepo salesOutletRepo;

    public DashboardStats getDashboardStats() {
        // KPIs
        Double revenue        = salesReceiptRepo.totalRevenue();
        Long transactions     = salesReceiptRepo.totalTransactions();
        Long itemsSold        = salesReceiptRepo.totalItemsSold();
        Long customers        = salesReceiptRepo.uniqueCustomers();
        LocalDate minDate     = salesReceiptRepo.minDate();
        LocalDate maxDate     = salesReceiptRepo.maxDate();

        // Revenue trend over time
        List<Object[]> revPerDay = salesReceiptRepo.revenuePerDay();
        List<String> revDates  = new ArrayList<>();
        List<Double> revValues = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        for (Object[] row : revPerDay) {
            LocalDate d = (LocalDate) row[0];
            Double    v = ((Number) row[1]).doubleValue();
            revDates.add(d.format(fmt));
            revValues.add(Math.round(v * 100.0) / 100.0);
        }

        // Top 10 products by quantity
        Map<Integer, String> productNames = buildProductNameMap();
        Map<Integer, String> productCats  = buildProductCategoryMap();
        List<Object[]> topByQty = salesReceiptRepo.topProductsByQuantity();
        List<String> topNames = new ArrayList<>();
        List<Long>   topQty   = new ArrayList<>();
        int c = 0;
        for (Object[] row : topByQty) {
            if (c++ >= 10) break;
            Integer pid = ((Number) row[0]).intValue();
            Long    qty = ((Number) row[1]).longValue();
            topNames.add(productNames.getOrDefault(pid, "Product " + pid));
            topQty.add(qty);
        }

        // Hourly sales distribution
        List<Object[]> hourly = salesReceiptRepo.salesByHour();
        List<String> hourLabels  = new ArrayList<>();
        List<Long>   hourlySales = new ArrayList<>();
        for (Object[] row : hourly) {
            int hr = ((Number) row[0]).intValue();
            Long cnt = ((Number) row[1]).longValue();
            hourLabels.add(hr + ":00");
            hourlySales.add(cnt);
        }

        // Revenue by outlet
        Map<Integer, String> outletNames = buildOutletNameMap();
        List<Object[]> outletRev = salesReceiptRepo.revenueByOutlet();
        List<String> outletLabels  = new ArrayList<>();
        List<Double> outletRevenue = new ArrayList<>();
        for (Object[] row : outletRev) {
            Integer oid = ((Number) row[0]).intValue();
            Double  rev = ((Number) row[1]).doubleValue();
            outletLabels.add(outletNames.getOrDefault(oid, "Outlet " + oid));
            outletRevenue.add(Math.round(rev * 100.0) / 100.0);
        }

        // Instore vs online
        List<Object[]> split = salesReceiptRepo.instoreVsOnline();
        long instoreCount = 0, onlineCount = 0;
        for (Object[] row : split) {
            String yn  = (String) row[0];
            Long   cnt = ((Number) row[1]).longValue();
            if ("Y".equalsIgnoreCase(yn)) instoreCount = cnt;
            else                          onlineCount  = cnt;
        }

        // Sales by product category
        Map<String, Long> catQtyMap = new LinkedHashMap<>();
        List<Object[]> qtyPerProduct = salesReceiptRepo.quantityPerProduct();
        for (Object[] row : qtyPerProduct) {
            Integer pid = ((Number) row[0]).intValue();
            Long    qty = ((Number) row[1]).longValue();
            String  cat = productCats.getOrDefault(pid, "Other");
            catQtyMap.merge(cat, qty, Long::sum);
        }
        List<Map.Entry<String, Long>> sortedCats = catQtyMap.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8).collect(Collectors.toList());
        List<String> categoryLabels = sortedCats.stream().map(Map.Entry::getKey).collect(Collectors.toList());
        List<Long>   categoryQty    = sortedCats.stream().map(Map.Entry::getValue).collect(Collectors.toList());

        return DashboardStats.builder()
                .totalRevenue(revenue)
                .totalTransactions(transactions)
                .totalItemsSold(itemsSold)
                .uniqueCustomers(customers)
                .dateRangeStart(minDate != null ? minDate.toString() : "")
                .dateRangeEnd(maxDate   != null ? maxDate.toString()  : "")
                .revenueDates(revDates)
                .revenueValues(revValues)
                .topProductNames(topNames)
                .topProductQty(topQty)
                .hourLabels(hourLabels)
                .hourlySales(hourlySales)
                .outletLabels(outletLabels)
                .outletRevenue(outletRevenue)
                .instoreCount(instoreCount)
                .onlineCount(onlineCount)
                .categoryLabels(categoryLabels)
                .categoryQty(categoryQty)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<Integer, String> buildProductNameMap() {
        Map<Integer, String> map = new HashMap<>();
        productRepo.findAll().forEach(p -> map.put(p.getProductId(), p.getProduct()));
        return map;
    }

    private Map<Integer, String> buildProductCategoryMap() {
        Map<Integer, String> map = new HashMap<>();
        productRepo.findAll().forEach(p -> map.put(p.getProductId(), p.getProductCategory()));
        return map;
    }

    private Map<Integer, String> buildOutletNameMap() {
        Map<Integer, String> map = new HashMap<>();
        salesOutletRepo.findAll().forEach(o -> map.put(o.getSalesOutletId(),
                o.getNeighborhood() != null ? o.getNeighborhood() : "Outlet " + o.getSalesOutletId()));
        return map;
    }
}
