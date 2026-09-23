package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "nc_evidence")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NCEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ncId;

    @Column(nullable = false)
    private Integer submissionNumber;

    @Column(columnDefinition = "TEXT")
    private String evidenceText;

    @Column(columnDefinition = "json")
    private String evidenceFiles;

    @Column(nullable = false)
    private Long submittedBy;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    @Column(length = 30)
    private String auditorReviewStatus;

    @Column(columnDefinition = "TEXT")
    private String auditorFeedback;

    private Long reviewedBy;

    private LocalDateTime reviewedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
