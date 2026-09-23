package com.halalcms.applicationservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "hcb_accreditation_scopes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HcbAccreditationScope {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String body;

    @Column(nullable = false)
    private String standard;

    private String certNumber;

    @Column(columnDefinition = "TEXT")
    private String scope;

    private String country;
    private LocalDate issueDate;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String certFileData;

    private String certFileName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
