package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.NonConformity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NonConformityRepository extends JpaRepository<NonConformity, Long> {
    List<NonConformity> findByApplicationId(Long applicationId);

    Optional<NonConformity> findByApplicationIdAndQuestionId(Long applicationId, String questionId);

    long countByApplicationId(Long applicationId);

    long countByApplicationIdAndIsCleared(Long applicationId, boolean isCleared);
}
