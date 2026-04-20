package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "sales_receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;

    @Column(name = "transaction_time")
    private LocalTime transactionTime;

    @Column(name = "sales_outlet_id")
    private Integer salesOutletId;

    @Column(name = "staff_id")
    private Integer staffId;

    @Column(name = "customer_id")
    private Integer customerId;

    @Column(name = "instore_yn")
    private String instoreYn;

    @Column(name = "line_item_id")
    private Integer lineItemId;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "line_item_amount")
    private Double lineItemAmount;

    @Column(name = "unit_price")
    private Double unitPrice;

    @Column(name = "promo_item_yn")
    private String promoItemYn;
}
