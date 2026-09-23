package com.halalcms.companyservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID ownerId;  // references User.id in auth-service

    @Column(nullable = false, unique = true)
    private String registrationNumber;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessType businessType;

    @Column(nullable = false)
    private String address;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postcode;
    private String country;

    private String phone;
    private String email;
    private String website;

    @Enumerated(EnumType.STRING)
    private ActivityCategory activityCategory;

    @Column(columnDefinition = "TEXT")
    private String specificActivities;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate incorporationDate;

    private String contactName;
    private String contactDesignation;
    private Integer employeeCount;
    private String latitude;
    private String longitude;
    private String licenseNo;
    private LocalDate licenseExpiry;
    private String issuingAuthority;
    private String licenseFileName;
    private Long licenseFileSize;

    @Column(columnDefinition = "TEXT")
    private String licenseFileData;

    private String vatNo;
    private String sstNo;
    private String vatFileName;
    private Long vatFileSize;

    @Column(columnDefinition = "TEXT")
    private String vatFileData;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CompanyStatus status = CompanyStatus.ACTIVE;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum BusinessType {
        SOLE_PROPRIETOR, PARTNERSHIP, PRIVATE_LIMITED, PUBLIC_LIMITED, COOPERATIVE, OTHER
    }

    public enum ActivityCategory {
        FOOD_MANUFACTURER, FOOD_IMPORTER, FOOD_EXPORTER,
        FOOD_SERVICE, RETAILER, DISTRIBUTOR,
        SLAUGHTERHOUSE, LOGISTICS, COSMETICS, PHARMACEUTICAL, OTHER
    }

    public enum CompanyStatus {
        ACTIVE, SUSPENDED, DEREGISTERED
    }
}
