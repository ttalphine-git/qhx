package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "non_conformities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NonConformity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(length = 100)
    private String questionId;

    @Column(columnDefinition = "TEXT")
    private String questionText;

    private Long auditorId;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String ncEvidenceJson;

    @Column(columnDefinition = "TEXT")
    private String customerComment;

    @Column(columnDefinition = "TEXT")
    private String customerEvidenceJson;

    @Column(columnDefinition = "TEXT")
    private String auditorComment;

    @Column(columnDefinition = "TEXT")
    private String auditorEvidenceJson;

    @Column(columnDefinition = "TEXT")
    private String shariaComment;

    @Column(columnDefinition = "TEXT")
    private String shariaEvidenceJson;

    @Column(length = 100)
    private String createdBy;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "LOW";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN";

    @Column(columnDefinition = "TEXT")
    private String customerCorrectiveAction;

    private LocalDate customerDueDate;

    @Builder.Default
    private Boolean isCleared = false;

    private LocalDateTime clearedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;
}
