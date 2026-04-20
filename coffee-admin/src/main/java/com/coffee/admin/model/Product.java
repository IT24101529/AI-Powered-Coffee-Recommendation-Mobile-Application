package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_group")
    private String productGroup;

    @Column(name = "product_category")
    private String productCategory;

    @Column(name = "product_type")
    private String productType;

    @Column(name = "product")
    private String product;

    @Column(name = "product_description", length = 1000)
    private String productDescription;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure;

    @Column(name = "current_wholesale_price")
    private Double currentWholesalePrice;

    @Column(name = "current_retail_price")
    private String currentRetailPrice;

    @Column(name = "tax_exempt_yn")
    private String taxExemptYn;

    @Column(name = "promo_yn")
    private String promoYn;

    @Column(name = "new_product_yn")
    private String newProductYn;
}
