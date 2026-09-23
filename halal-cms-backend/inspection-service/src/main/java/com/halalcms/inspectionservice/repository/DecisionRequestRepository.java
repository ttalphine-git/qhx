package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.DecisionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DecisionRequestRepository extends JpaRepository<DecisionRequest, Long> {
    List<DecisionRequest> findByAuditId(Long auditId);

    List<DecisionRequest> findByAssignedToAndStatus(Long assignedTo, String status);

    Optional<DecisionRequest> findByAuditIdAndDecisionType(Long auditId, String decisionType);

    List<DecisionRequest> findByAuditIdAndStatus(Long auditId, String status);
}
