package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ApplicationRepository extends JpaRepository<Application, Long>,
        JpaSpecificationExecutor<Application> {

    Page<Application> findByUserId(String userId, Pageable pageable);

    Page<Application> findAll(Specification<Application> spec, Pageable pageable);

    long countByUserId(String userId);
}
