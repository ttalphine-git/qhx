package com.halalcms.applicationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationPaymentStatusDto {
    private Long applicationId;
    private boolean paymentRequired;
    private String paymentStatus;
    private BigDecimal amount;
    private String currency;
    private String reference;
}
