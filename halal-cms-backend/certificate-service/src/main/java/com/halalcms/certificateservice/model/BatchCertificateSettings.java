package com.halalcms.certificateservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "batch_certificate_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCertificateSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unit_price_per_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPricePerKg;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "MYR";

    @Column(name = "feature_enabled", nullable = false)
    @Builder.Default
    private Boolean featureEnabled = true;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
