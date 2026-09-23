package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.CertificateWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateWorkflowRepository extends JpaRepository<CertificateWorkflow, Long> {
    Optional<CertificateWorkflow> findByAuditId(Long auditId);

    List<CertificateWorkflow> findByApplicationId(Long applicationId);

    Optional<CertificateWorkflow> findByCertificateNumber(String certificateNumber);

    List<CertificateWorkflow> findByStatus(String status);
}
