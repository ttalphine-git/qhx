package com.halalcms.companyservice.dto;

import com.halalcms.companyservice.model.Product;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ProductRequest {
    @NotBlank private String name;
    private String sku;
    private String brand;
    @NotNull  private Product.ProductCategory category;
    private String description;
    private List<String> ingredients;
    private UUID factoryId;
}
