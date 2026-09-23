package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private AuditReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private AuditQuestion question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(length = 20)
    private String answer;

    @Column(length = 20)
    private String finding;

    @Column(columnDefinition = "TEXT")
    private String customerComment;

    @Column(columnDefinition = "TEXT")
    private String auditorComment;

    @Column(columnDefinition = "TEXT")
    private String shariaComment;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
