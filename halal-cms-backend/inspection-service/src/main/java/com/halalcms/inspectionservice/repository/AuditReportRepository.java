package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.AuditReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuditReportRepository extends JpaRepository<AuditReport, Long> {
    Optional<AuditReport> findByApplicationId(Long applicationId);
}
