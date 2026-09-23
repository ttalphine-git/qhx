package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_logs", indexes = {
    @Index(name = "idx_wflog_app", columnList = "application_id"),
    @Index(name = "idx_wflog_audit", columnList = "audit_id"),
    @Index(name = "idx_wflog_action", columnList = "action_type"),
    @Index(name = "idx_wflog_user", columnList = "performed_by_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "action_type", length = 100)
    private String actionType;

    @Column(name = "action_description", columnDefinition = "TEXT")
    private String actionDescription;

    @Column(name = "performed_by_user_id", length = 100)
    private String performedByUserId;

    @Column(name = "performed_by_role", length = 30)
    private String performedByRole;

    @Column(name = "old_status", length = 30)
    private String oldStatus;

    @Column(name = "new_status", length = 30)
    private String newStatus;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
