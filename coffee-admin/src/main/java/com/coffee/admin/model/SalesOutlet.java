package com.coffee.admin.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sales_outlets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOutlet {

    @Id
    @Column(name = "sales_outlet_id")
    private Integer salesOutletId;

    @Column(name = "sales_outlet_type")
    private String salesOutletType;

    @Column(name = "store_address")
    private String storeAddress;

    @Column(name = "store_city")
    private String storeCity;

    @Column(name = "store_state_province")
    private String storeStateProvince;

    @Column(name = "store_telephone")
    private String storeTelephone;

    @Column(name = "neighborhood")
    private String neighborhood;

    @Column(name = "manager")
    private String manager;
}
