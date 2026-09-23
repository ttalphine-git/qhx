package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_event_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long applicationId;

    @Column(nullable = false, length = 100)
    private String event;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String performedBy;

    @CreationTimestamp
    private LocalDateTime performedAt;

    @Column(length = 50)
    private String oldStatus;

    @Column(length = 50)
    private String newStatus;
}
