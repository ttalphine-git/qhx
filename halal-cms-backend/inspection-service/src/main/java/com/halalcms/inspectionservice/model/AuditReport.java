package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audit_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "configuration_id")
    private AuditReportConfiguration configuration;

    @Column(length = 120)
    private String activityCategoryKey;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String generalComment;

    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<AuditAnswer> answers = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
