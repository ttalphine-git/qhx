package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.WorkflowLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkflowLogRepository extends JpaRepository<WorkflowLog, Long> {

    List<WorkflowLog> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    Page<WorkflowLog> findByApplicationIdOrderByCreatedAtDesc(Long applicationId, Pageable pageable);

    List<WorkflowLog> findByAuditIdOrderByCreatedAtDesc(Long auditId);

    Page<WorkflowLog> findByAuditIdOrderByCreatedAtDesc(Long auditId, Pageable pageable);

    List<WorkflowLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    @Query("SELECT l FROM WorkflowLog l WHERE l.performedByUserId = :userId AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    List<WorkflowLog> findUserActivityBetween(@Param("userId") String userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT l FROM WorkflowLog l WHERE l.applicationId = :appId AND l.actionType = :actionType ORDER BY l.createdAt DESC")
    List<WorkflowLog> findByApplicationIdAndActionType(@Param("appId") Long appId, @Param("actionType") String actionType);
}
