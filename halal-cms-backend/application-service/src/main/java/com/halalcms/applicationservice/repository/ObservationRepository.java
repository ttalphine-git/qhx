package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.Observation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObservationRepository extends JpaRepository<Observation, Long> {

    List<Observation> findByApplicationId(Long applicationId);

    void deleteByApplicationIdAndQuestionId(Long applicationId, String questionId);
}
