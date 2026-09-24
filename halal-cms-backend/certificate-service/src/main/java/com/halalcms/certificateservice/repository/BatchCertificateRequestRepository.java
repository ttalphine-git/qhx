package com.halalcms.certificateservice.repository;

import com.halalcms.certificateservice.model.BatchCertificateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchCertificateRequestRepository extends JpaRepository<BatchCertificateRequest, Long> {
    Optional<BatchCertificateRequest> findByRequestNumber(String requestNumber);

    Page<BatchCertificateRequest> findByUserId(String userId, Pageable pageable);

    Page<BatchCertificateRequest> findByUserIdAndStatus(String userId, String status, Pageable pageable);

    Page<BatchCertificateRequest> findByStatus(String status, Pageable pageable);

    Page<BatchCertificateRequest> findByCompanyId(String companyId, Pageable pageable);

    List<BatchCertificateRequest> findByFactoryCertificateId(Long certificateId);

    Page<BatchCertificateRequest> findByFactoryId(String factoryId, Pageable pageable);
}
