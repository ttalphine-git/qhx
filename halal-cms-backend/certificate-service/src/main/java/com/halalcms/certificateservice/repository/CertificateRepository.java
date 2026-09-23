package com.halalcms.certificateservice.repository;

import com.halalcms.certificateservice.model.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByCertificateKey(String certificateKey);

    Optional<Certificate> findByApplicationId(Long applicationId);

    Page<Certificate> findAll(Pageable pageable);

    Page<Certificate> findByCompanyNameContainingIgnoreCase(String search, Pageable pageable);

    long countByStatus(String status);
}
