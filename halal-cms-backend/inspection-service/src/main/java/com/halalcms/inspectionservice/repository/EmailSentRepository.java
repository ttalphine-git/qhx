package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.EmailSent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailSentRepository extends JpaRepository<EmailSent, Long> {

    Page<EmailSent> findByRecipientEmailOrderBySentAtDesc(String recipientEmail, Pageable pageable);

    List<EmailSent> findByEmailTypeAndDeliveryStatus(String emailType, String deliveryStatus);

    @Query("SELECT e FROM EmailSent e WHERE e.deliveryStatus = 'FAILED' AND e.sentAt BETWEEN :startDate AND :endDate")
    List<EmailSent> findFailedEmailsSince(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(e) FROM EmailSent e WHERE e.recipientEmail = :email AND e.sentAt >= :since")
    long countEmailsSentTo(@Param("email") String email, @Param("since") LocalDateTime since);

    Page<EmailSent> findByEmailTypeOrderBySentAtDesc(String emailType, Pageable pageable);

    List<EmailSent> findByRelatedApplicationId(Long applicationId);

    List<EmailSent> findByRelatedAuditId(Long auditId);
}
