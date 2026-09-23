package com.halalcms.companyservice.repository;

import com.halalcms.companyservice.model.Factory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FactoryRepository extends JpaRepository<Factory, UUID> {
    Page<Factory> findByCompanyId(UUID companyId, Pageable pageable);
    List<Factory> findByCompanyId(UUID companyId);
    long countByCompanyId(UUID companyId);
}
