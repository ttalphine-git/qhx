package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "decision_request")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DecisionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long auditId;

    @Column(nullable = false)
    private Long applicationId;

    @Column(nullable = false)
    private Long assignedTo;

    @Column(nullable = false, length = 30)
    private String decisionType;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String decisionText;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @Column(length = 20)
    private String decisionValue;

    private Long decidedBy;

    private LocalDateTime decidedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
