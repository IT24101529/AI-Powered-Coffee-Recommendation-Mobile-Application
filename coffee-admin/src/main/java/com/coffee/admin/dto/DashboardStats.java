package com.coffee.admin.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private Double totalRevenue;
    private Long totalTransactions;
    private Long totalItemsSold;
    private Long uniqueCustomers;
    private String dateRangeStart;
    private String dateRangeEnd;
    private List<String> revenueDates;
    private List<Double> revenueValues;
    private List<String> topProductNames;
    private List<Long> topProductQty;
    private List<String> hourLabels;
    private List<Long> hourlySales;
    private List<String> outletLabels;
    private List<Double> outletRevenue;
    private Long instoreCount;
    private Long onlineCount;
    private List<String> categoryLabels;
    private List<Long> categoryQty;
}
