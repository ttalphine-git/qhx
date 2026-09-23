package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByApplicationId(Long applicationId);
}
