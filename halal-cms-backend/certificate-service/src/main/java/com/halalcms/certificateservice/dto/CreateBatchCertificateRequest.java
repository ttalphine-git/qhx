package com.halalcms.certificateservice.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBatchCertificateRequest {

    @NotNull(message = "Factory ID is required")
    private UUID factoryId;

    @NotNull(message = "Factory certificate ID is required")
    private Long factoryCertificateId;

    @NotBlank(message = "Producer name is required")
    private String producerName;

    private String producerPhone;

    @Email(message = "Producer email must be valid")
    private String producerEmail;

    private String producerContact;

    private String importerName;
    private String importerCountry;
    private String importerContact;

    private String exporterName;
    private String exporterCountry;
    private String exporterContact;

    @NotNull(message = "Shipment date is required")
    private LocalDate shipmentDate;

    private String shipmentReference;

    @NotBlank(message = "Origin country is required")
    private String originCountry;

    @NotBlank(message = "Destination country is required")
    private String destinationCountry;

    @NotEmpty(message = "At least one product is required")
    private List<ProductBatchItem> products;

    @NotNull(message = "Total weight is required")
    @DecimalMin(value = "0.01", message = "Total weight must be greater than 0")
    private BigDecimal totalWeightKg;
}
