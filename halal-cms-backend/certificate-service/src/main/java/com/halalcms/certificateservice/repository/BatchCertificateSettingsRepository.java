package com.halalcms.certificateservice.repository;

import com.halalcms.certificateservice.model.BatchCertificateSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BatchCertificateSettingsRepository extends JpaRepository<BatchCertificateSettings, Long> {
}
