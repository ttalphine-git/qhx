package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "emails_sent", indexes = {
    @Index(name = "idx_email_recipient", columnList = "recipient_email"),
    @Index(name = "idx_email_user", columnList = "recipient_user_id"),
    @Index(name = "idx_email_status", columnList = "delivery_status"),
    @Index(name = "idx_email_type", columnList = "email_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailSent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "recipient_user_id", length = 100)
    private String recipientUserId;

    @Column(name = "subject", length = 255)
    private String subject;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "email_type", length = 50)
    private String emailType;

    @Column(name = "related_audit_id")
    private Long relatedAuditId;

    @Column(name = "related_application_id")
    private Long relatedApplicationId;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivery_status", length = 30)
    private String deliveryStatus;

    @Column(name = "delivery_error", columnDefinition = "TEXT")
    private String deliveryError;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
