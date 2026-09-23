package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(length = 36)
    private String auditorId;

    @Column(length = 255)
    private String auditorName;

    private LocalDate scheduledDate;

    private Integer durationDays;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
