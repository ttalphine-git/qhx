package com.halalcms.certificateservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchCertificateSettingsDto {
    private Long id;

    @NotNull(message = "Unit price per kg is required")
    @DecimalMin(value = "0.01", message = "Unit price must be greater than 0")
    private BigDecimal unitPricePerKg;

    private String currency;
    private Boolean featureEnabled;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
