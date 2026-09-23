package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {

    List<ApplicationDocument> findByApplicationId(Long applicationId);
}
