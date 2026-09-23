package com.halalcms.inspectionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long auditId;

    @Column(nullable = false)
    private Long applicationId;

    @Column(unique = true, length = 50)
    private String certificateNumber;

    private Long templateId;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "GENERATED";

    @CreationTimestamp
    private LocalDateTime generatedAt;

    private LocalDate validFrom;

    private LocalDate validTo;

    @Column(length = 100)
    private String approvedBy;

    private LocalDateTime approvedAt;

    @Column(columnDefinition = "TEXT")
    private String approvalNotes;

    private LocalDateTime sentAt;

    private LocalDateTime sentToCustomerAt;

    @Column(length = 255)
    private String sentToEmail;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
