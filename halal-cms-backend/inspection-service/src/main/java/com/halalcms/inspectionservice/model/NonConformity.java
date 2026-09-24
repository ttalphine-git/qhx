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

    private Long auditorId;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

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
