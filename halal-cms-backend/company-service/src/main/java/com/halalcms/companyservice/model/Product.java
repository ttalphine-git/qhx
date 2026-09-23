package com.halalcms.companyservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID companyId;

    private UUID factoryId;    // optional – which factory produces this

    @Column(nullable = false)
    private String name;

    private String sku;
    private String brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "product_ingredients", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "ingredient")
    @Builder.Default
    private List<String> ingredients = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HalalStatus halalStatus = HalalStatus.PENDING;

    private String certificationNumber;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum ProductCategory {
        FOOD, BEVERAGE, COSMETICS, PHARMACEUTICAL, SUPPLEMENT,
        MEAT_POULTRY, SEAFOOD, BAKERY, DAIRY, SNACK, OTHER
    }

    public enum HalalStatus {
        PENDING, UNDER_REVIEW, CERTIFIED, REJECTED, EXPIRED
    }
}
