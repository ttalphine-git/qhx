package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyInformationDTO {
    private String companyName;
    private String registrationNumber;
    private String address;
    private String city;
    private String country;
    private String phone;
    private String email;
    private String website;
    private String industry;
    private String companyType;
    private String businessLicenseNo;
    private String licenseExpiry;
    private String issuingAuthority;
    private String vatSstNo;
}
