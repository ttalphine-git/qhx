package com.halalcms.authservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // OFFICE_ADMIN, OFFICE_INSPECTOR, CUSTOMER

    @Column(nullable = false)
    private String fullName;

    private UUID companyId; // null for office staff

    // Employee profile fields (null for non-office users)
    private String phone;
    private String jobTitle;
    private String department;
    private String employmentType; // OWN | OUTSOURCE
    private String idProofNumber;
    private String startDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String idDocName;

    @Column(columnDefinition = "TEXT")
    private String idDocData;

    @Column(columnDefinition = "TEXT")
    private String photoData;

    @Column(nullable = false, columnDefinition = "boolean DEFAULT true")
    @Builder.Default
    private boolean enabled = true;

    @Column(nullable = false, columnDefinition = "boolean DEFAULT false")
    @Builder.Default
    private boolean emailVerified = false;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public enum UserRole {
        SUPER_ADMIN, OFFICE_ADMIN, OFFICE_INSPECTOR, OFFICE_REVIEWER, CUSTOMER,
        AUDITOR, SHARIA_AUDITOR, DECISION_MAKER, FINANCE,
        HALAL_REVIEWER, AUDIT_PLANNER, CERTIFICATE_CONTROLLER, QUALITY_MANAGER
    }
}
