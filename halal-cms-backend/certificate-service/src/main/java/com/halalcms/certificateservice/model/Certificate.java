package com.halalcms.certificateservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_key", nullable = false, unique = true, length = 50)
    private String certificateKey;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "certificate_number", unique = true, length = 100)
    private String certificateNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "halal_standard", length = 255)
    private String halalStandard;

    @Column(name = "products", columnDefinition = "TEXT")
    private String products;

    @Column(name = "issued_by", length = 255)
    private String issuedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
