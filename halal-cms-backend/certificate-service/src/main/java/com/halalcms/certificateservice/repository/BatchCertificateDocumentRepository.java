package com.halalcms.certificateservice.repository;

import com.halalcms.certificateservice.model.BatchCertificateDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchCertificateDocumentRepository extends JpaRepository<BatchCertificateDocument, Long> {
    List<BatchCertificateDocument> findByBatchRequestId(Long batchRequestId);
}
