package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_report_summary")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditReportSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long auditId;

    @Column(columnDefinition = "TEXT")
    private String mainAuditorSummary;

    @Column(columnDefinition = "TEXT")
    private String shariaSummary;

    @Column(columnDefinition = "json")
    private String compliedProducts;

    @Column(columnDefinition = "json")
    private String nonCompliedProducts;

    private Long submittedBy;

    private LocalDateTime submittedAt;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
