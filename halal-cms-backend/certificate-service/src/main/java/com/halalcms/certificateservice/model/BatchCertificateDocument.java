package com.halalcms.certificateservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "batch_certificate_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchCertificateDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_request_id", nullable = false)
    private Long batchRequestId;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "filename", nullable = false, length = 500)
    private String filename;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
}
