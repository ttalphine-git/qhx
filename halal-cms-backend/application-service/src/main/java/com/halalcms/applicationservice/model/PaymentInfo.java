package com.halalcms.applicationservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false, unique = true)
    private Long applicationId;

    @Column(name = "payment_required")
    @Builder.Default
    private Boolean paymentRequired = false;

    @Column(name = "payment_status")
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column
    @Builder.Default
    private String currency = "MYR";

    @Column
    private String reference;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
