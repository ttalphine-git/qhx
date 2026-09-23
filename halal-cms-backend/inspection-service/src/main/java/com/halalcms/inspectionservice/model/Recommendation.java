package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(length = 20)
    @Builder.Default
    private String priority = "MEDIUM";

    @Column(length = 255)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
