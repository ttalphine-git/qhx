package com.halalcms.certificateservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatchItem {
    private String sku;
    private String name;
    private BigDecimal weightKg;
    private String unit;
}
