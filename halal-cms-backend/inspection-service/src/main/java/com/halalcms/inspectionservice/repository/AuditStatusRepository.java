package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.AuditStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditStatusRepository extends JpaRepository<AuditStatus, Long> {
    Optional<AuditStatus> findByApplicationId(Long applicationId);
}
