package com.coffee.admin.repository;

import com.coffee.admin.model.SalesReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesReceiptRepo extends JpaRepository<SalesReceipt, Long> {

    @Query("SELECT COALESCE(SUM(s.lineItemAmount), 0) FROM SalesReceipt s")
    Double totalRevenue();

    @Query("SELECT COUNT(DISTINCT s.transactionId) FROM SalesReceipt s")
    Long totalTransactions();

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM SalesReceipt s")
    Long totalItemsSold();

    @Query("SELECT COUNT(DISTINCT s.customerId) FROM SalesReceipt s")
    Long uniqueCustomers();

    @Query("SELECT s.transactionDate, SUM(s.lineItemAmount) FROM SalesReceipt s GROUP BY s.transactionDate ORDER BY s.transactionDate")
    List<Object[]> revenuePerDay();

    @Query("SELECT s.productId, SUM(s.quantity) as qty FROM SalesReceipt s GROUP BY s.productId ORDER BY qty DESC")
    List<Object[]> topProductsByQuantity();

    @Query("SELECT s.productId, SUM(s.lineItemAmount) as rev FROM SalesReceipt s GROUP BY s.productId ORDER BY rev DESC")
    List<Object[]> topProductsByRevenue();

    @Query(value = "SELECT EXTRACT(HOUR FROM transaction_time) as hr, COUNT(*) as cnt FROM sales_receipts GROUP BY hr ORDER BY hr", nativeQuery = true)
    List<Object[]> salesByHour();

    @Query("SELECT s.productId, SUM(s.quantity) FROM SalesReceipt s WHERE s.transactionDate >= :from GROUP BY s.productId")
    List<Object[]> salesPerProductSince(@Param("from") LocalDate from);

    @Query("SELECT s.salesOutletId, SUM(s.lineItemAmount) FROM SalesReceipt s GROUP BY s.salesOutletId")
    List<Object[]> revenueByOutlet();

    @Query("SELECT s.productId, SUM(s.quantity) FROM SalesReceipt s GROUP BY s.productId")
    List<Object[]> quantityPerProduct();

    @Query("SELECT MIN(s.transactionDate) FROM SalesReceipt s")
    LocalDate minDate();

    @Query("SELECT MAX(s.transactionDate) FROM SalesReceipt s")
    LocalDate maxDate();

    @Query("SELECT s.instoreYn, COUNT(DISTINCT s.transactionId) FROM SalesReceipt s GROUP BY s.instoreYn")
    List<Object[]> instoreVsOnline();

    @Query(value = "SELECT TO_CHAR(transaction_date,'Day') as dow, SUM(line_item_amount) FROM sales_receipts GROUP BY dow ORDER BY MIN(EXTRACT(DOW FROM transaction_date))", nativeQuery = true)
    List<Object[]> revenueByWeekday();

    @Query("SELECT s.productId, SUM(s.quantity) FROM SalesReceipt s WHERE s.transactionDate >= :from AND s.transactionDate < :to GROUP BY s.productId")
    List<Object[]> salesPerProductBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
