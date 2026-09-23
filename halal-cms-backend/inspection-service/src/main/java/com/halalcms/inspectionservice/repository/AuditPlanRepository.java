package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.AuditPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditPlanRepository extends JpaRepository<AuditPlan, Long> {
    Optional<AuditPlan> findByApplicationId(Long applicationId);
}
