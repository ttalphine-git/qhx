package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.EventLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventLogRepository extends JpaRepository<EventLog, Long> {
    Page<EventLog> findByApplicationIdOrderByPerformedAtDesc(Long applicationId, Pageable pageable);
}
