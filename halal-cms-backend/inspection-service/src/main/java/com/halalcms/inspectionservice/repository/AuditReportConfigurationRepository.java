package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.AuditReportConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditReportConfigurationRepository extends JpaRepository<AuditReportConfiguration, Long> {
    List<AuditReportConfiguration> findByActiveTrueOrderBySortOrderAscIdAsc();
}
