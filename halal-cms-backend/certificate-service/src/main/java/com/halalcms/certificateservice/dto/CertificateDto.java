package com.halalcms.certificateservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CertificateDto {

    private Long id;
    private String key;
    private Long applicationId;
    private String companyName;
    private String certificateNumber;
    private String issueDate;
    private String expiryDate;
    private String status;
    private String halalStandard;
    private List<String> products;
    private String issuedBy;
}
