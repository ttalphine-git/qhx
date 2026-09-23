package com.halalcms.companyservice.dto;

import com.halalcms.companyservice.model.Company;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data @Builder
public class CompanyResponse {
    private UUID id;
    private UUID ownerId;
    private String registrationNumber;
    private String name;
    private Company.BusinessType businessType;
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
    private Company.ActivityCategory activityCategory;
    private String specificActivities;
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
    private String licenseFileData;
    private String vatNo;
    private String sstNo;
    private String vatFileName;
    private Long vatFileSize;
    private String vatFileData;
    private Company.CompanyStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
