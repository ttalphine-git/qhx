package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_statuses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long applicationId;

    @Column(length = 50)
    @Builder.Default
    private String currentPhase = "SUBMITTED";

    @Column(name = "f1_started", nullable = false)
    @Builder.Default
    private Boolean f1Started = false;

    @Column(name = "f1_completed", nullable = false)
    @Builder.Default
    private Boolean f1Completed = false;

    @Column(name = "f2_started", nullable = false)
    @Builder.Default
    private Boolean f2Started = false;

    @Column(name = "f2_completed", nullable = false)
    @Builder.Default
    private Boolean f2Completed = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean complianceAssigned = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean certificationFinalized = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
