package com.halalcms.applicationservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_number", nullable = false, unique = true)
    private String applicationNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationType type = ApplicationType.NEW;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "company_id")
    private String companyId;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "assigned_auditor_id")
    private String assignedAuditorId;

    @Column(name = "assigned_auditor_name")
    private String assignedAuditorName;

    @Column(name = "halal_standard")
    private String halalStandard;

    @Column(name = "country")
    private String country;

    @Column(name = "product_count")
    private Integer productCount;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
