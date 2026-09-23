package com.halalcms.companyservice.dto;

import com.halalcms.companyservice.model.Product;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class ProductResponse {
    private UUID id;
    private UUID companyId;
    private UUID factoryId;
    private String name;
    private String sku;
    private String brand;
    private Product.ProductCategory category;
    private String description;
    private List<String> ingredients;
    private Product.HalalStatus halalStatus;
    private String certificationNumber;
    private Instant createdAt;
    private Instant updatedAt;
}
