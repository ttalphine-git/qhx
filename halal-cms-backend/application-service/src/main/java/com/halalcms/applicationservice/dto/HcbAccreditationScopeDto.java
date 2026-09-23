package com.halalcms.applicationservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class HcbAccreditationScopeDto {
    private Long id;
    private String body;
    private String standard;
    private String certNumber;
    private String scope;
    private String country;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String certFileData;
    private String certFileName;
    private String notes;
    private BigDecimal unitPrice;
    private Instant createdAt;
    private Instant updatedAt;
}
