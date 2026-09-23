package com.halalcms.companyservice.repository;

import com.halalcms.companyservice.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID>, JpaSpecificationExecutor<Company> {
    Optional<Company> findByOwnerId(UUID ownerId);
    boolean existsByRegistrationNumber(String registrationNumber);
    List<Company> findAllByStatus(Company.CompanyStatus status);
}
