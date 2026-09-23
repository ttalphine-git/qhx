package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audit_report_configurations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditReportConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String reportTitle;

    @Column(columnDefinition = "TEXT")
    private String appliesTo;

    @Column(columnDefinition = "TEXT")
    private String activityCategoryKeys;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String riskLevel = "Standard";

    @Column(length = 80)
    private String formCode;

    private String revision;

    @Column(columnDefinition = "TEXT")
    private String stages;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "configuration", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @Builder.Default
    private List<AuditQuestion> questions = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
