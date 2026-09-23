package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.AuditQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditQuestionRepository extends JpaRepository<AuditQuestion, Long> {
}
