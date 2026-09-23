package com.halalcms.companyservice.repository;

import com.halalcms.companyservice.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Page<Product> findByCompanyId(UUID companyId, Pageable pageable);
    long countByCompanyId(UUID companyId);
    long countByCompanyIdAndHalalStatus(UUID companyId, Product.HalalStatus status);
}
