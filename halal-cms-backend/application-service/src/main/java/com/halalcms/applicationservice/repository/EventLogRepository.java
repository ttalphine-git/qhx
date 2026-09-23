package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.EventLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventLogRepository extends JpaRepository<EventLog, Long> {

    Page<EventLog> findByApplicationIdOrderByPerformedAtDesc(Long applicationId, Pageable pageable);
}
