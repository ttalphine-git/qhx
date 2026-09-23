package com.halalcms.companyservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "factories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Factory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID companyId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FactoryType factoryType;

    @Column(nullable = false)
    private String address;

    private String city;
    private String state;
    private String postcode;
    private String country;

    private String phone;
    private String pic;          // Person In Charge name
    private String picPhone;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FactoryStatus status = FactoryStatus.ACTIVE;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum FactoryType {
        PRODUCTION, WAREHOUSE, RETAIL_OUTLET, SLAUGHTERHOUSE, COLD_STORAGE, OFFICE
    }

    public enum FactoryStatus {
        ACTIVE, INACTIVE, CLOSED
    }
}
