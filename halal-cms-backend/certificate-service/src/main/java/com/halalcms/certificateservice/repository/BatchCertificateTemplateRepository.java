package com.halalcms.certificateservice.repository;

import com.halalcms.certificateservice.model.BatchCertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BatchCertificateTemplateRepository extends JpaRepository<BatchCertificateTemplate, Long> {
    Optional<BatchCertificateTemplate> findByIsDefaultTrue();
    Optional<BatchCertificateTemplate> findByName(String name);
}
