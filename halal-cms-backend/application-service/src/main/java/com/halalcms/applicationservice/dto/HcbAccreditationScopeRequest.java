package com.halalcms.applicationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class HcbAccreditationScopeRequest {
    @NotBlank
    private String body;

    @NotBlank
    private String standard;

    private String certNumber;
    private String scope;
    private String country;
    private LocalDate issueDate;

    @NotNull
    private LocalDate expiryDate;

    private String certFileData;
    private String certFileName;
    private String notes;
    private BigDecimal unitPrice;
}
