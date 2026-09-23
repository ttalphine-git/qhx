package com.halalcms.applicationservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "observations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "obs_evidence_json", columnDefinition = "TEXT")
    private String obsEvidenceJson;

    @Column(name = "customer_comment", columnDefinition = "TEXT")
    private String customerComment;

    @Column(name = "customer_evidence_json", columnDefinition = "TEXT")
    private String customerEvidenceJson;

    @Column(name = "auditor_comment", columnDefinition = "TEXT")
    private String auditorComment;

    @Column(name = "auditor_evidence_json", columnDefinition = "TEXT")
    private String auditorEvidenceJson;

    @Column(name = "sharia_comment", columnDefinition = "TEXT")
    private String shariaComment;

    @Column(name = "sharia_evidence_json", columnDefinition = "TEXT")
    private String shariaEvidenceJson;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
