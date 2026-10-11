package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.NonConformity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NonConformityRepository extends JpaRepository<NonConformity, Long> {

    List<NonConformity> findByApplicationId(Long applicationId);

    Optional<NonConformity> findByApplicationIdAndQuestionId(Long applicationId, String questionId);

    void deleteByApplicationIdAndQuestionId(Long applicationId, String questionId);
}
