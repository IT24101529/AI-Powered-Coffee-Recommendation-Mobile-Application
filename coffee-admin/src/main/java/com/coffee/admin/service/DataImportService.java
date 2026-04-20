package com.coffee.admin.service;

import com.coffee.admin.model.*;
import com.coffee.admin.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataImportService {

    private final ProductRepo productRepo;
    private final SalesReceiptRepo salesReceiptRepo;
    private final SalesOutletRepo salesOutletRepo;

    @Value("${app.csv.sales}")       private String salesCsv;
    @Value("${app.csv.product}")     private String productCsv;
    @Value("${app.csv.sales-outlet}") private String outletCsv;

    @PostConstruct
    @Transactional
    public void importOnStartup() {
        if (productRepo.count() == 0) {
            log.info("Importing CSV data into PostgreSQL...");
            importProducts();
            importOutlets();
            importSalesReceipts();
            log.info("CSV import complete.");
        } else {
            log.info("Data already present — skipping CSV import.");
        }
    }

    // ── Products ──────────────────────────────────────────────────────────────
    private void importProducts() {
        try (BufferedReader br = Files.newBufferedReader(Paths.get(productCsv))) {
            String header = br.readLine(); // skip header
            String line;
            List<Product> batch = new ArrayList<>();
            while ((line = br.readLine()) != null) {
                String[] f = parseCsvLine(line);
                if (f.length < 12) continue;
                try {
                    Product p = Product.builder()
                            .productId(parseInt(f[0]))
                            .productGroup(clean(f[1]))
                            .productCategory(clean(f[2]))
                            .productType(clean(f[3]))
                            .product(clean(f[4]))
                            .productDescription(clean(f[5]))
                            .unitOfMeasure(clean(f[6]))
                            .currentWholesalePrice(parseDouble(f[7]))
                            .currentRetailPrice(clean(f[8]))
                            .taxExemptYn(clean(f[9]))
                            .promoYn(clean(f[10]))
                            .newProductYn(clean(f[11]))
                            .build();
                    batch.add(p);
                } catch (Exception e) {
                    log.warn("Skipping product row: {}", e.getMessage());
                }
            }
            productRepo.saveAll(batch);
            log.info("Imported {} products", batch.size());
        } catch (IOException e) {
            log.error("Could not read product CSV: {}", e.getMessage());
        }
    }

    // ── Sales Outlets ─────────────────────────────────────────────────────────
    private void importOutlets() {
        try (BufferedReader br = Files.newBufferedReader(Paths.get(outletCsv))) {
            br.readLine(); // skip header
            String line;
            List<SalesOutlet> batch = new ArrayList<>();
            while ((line = br.readLine()) != null) {
                String[] f = parseCsvLine(line);
                if (f.length < 12) continue;
                try {
                    SalesOutlet o = SalesOutlet.builder()
                            .salesOutletId(parseInt(f[0]))
                            .salesOutletType(clean(f[1]))
                            .storeAddress(clean(f[3]))
                            .storeCity(clean(f[4]))
                            .storeStateProvince(clean(f[5]))
                            .storeTelephone(clean(f[6]))
                            .neighborhood(clean(f[11]))
                            .manager(clean(f[10]))
                            .build();
                    batch.add(o);
                } catch (Exception e) {
                    log.warn("Skipping outlet row: {}", e.getMessage());
                }
            }
            salesOutletRepo.saveAll(batch);
            log.info("Imported {} outlets", batch.size());
        } catch (IOException e) {
            log.error("Could not read outlets CSV: {}", e.getMessage());
        }
    }

    // ── Sales Receipts ────────────────────────────────────────────────────────
    private void importSalesReceipts() {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm:ss");
        try (BufferedReader br = Files.newBufferedReader(Paths.get(salesCsv))) {
            br.readLine(); // skip header
            String line;
            List<SalesReceipt> batch = new ArrayList<>();
            int count = 0;
            while ((line = br.readLine()) != null) {
                String[] f = parseCsvLine(line);
                if (f.length < 14) continue;
                try {
                    SalesReceipt s = SalesReceipt.builder()
                            .transactionId(parseInt(f[0]))
                            .transactionDate(LocalDate.parse(clean(f[1]), dateFmt))
                            .transactionTime(LocalTime.parse(clean(f[2]), timeFmt))
                            .salesOutletId(parseInt(f[3]))
                            .staffId(parseInt(f[4]))
                            .customerId(parseInt(f[5]))
                            .instoreYn(clean(f[6]))
                            .lineItemId(parseInt(f[8]))
                            .productId(parseInt(f[9]))
                            .quantity(parseInt(f[10]))
                            .lineItemAmount(parseDouble(f[11]))
                            .unitPrice(parseDouble(f[12]))
                            .promoItemYn(clean(f[13]))
                            .build();
                    batch.add(s);
                    count++;
                    if (batch.size() == 500) {
                        salesReceiptRepo.saveAll(batch);
                        batch.clear();
                    }
                } catch (Exception e) {
                    log.warn("Skipping sales row: {}", e.getMessage());
                }
            }
            if (!batch.isEmpty()) salesReceiptRepo.saveAll(batch);
            log.info("Imported {} sales receipts", count);
        } catch (IOException e) {
            log.error("Could not read sales CSV: {}", e.getMessage());
        }
    }

    // ── CSV helpers ───────────────────────────────────────────────────────────
    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { fields.add(sb.toString()); sb.setLength(0); }
            else { sb.append(c); }
        }
        fields.add(sb.toString());
        return fields.toArray(new String[0]);
    }

    private String clean(String s) {
        return s == null ? "" : s.trim().replace("\"", "");
    }

    private Integer parseInt(String s) {
        try { return Integer.parseInt(clean(s)); } catch (Exception e) { return 0; }
    }

    private Double parseDouble(String s) {
        try { return Double.parseDouble(clean(s).replace("$", "")); } catch (Exception e) { return 0.0; }
    }
}
