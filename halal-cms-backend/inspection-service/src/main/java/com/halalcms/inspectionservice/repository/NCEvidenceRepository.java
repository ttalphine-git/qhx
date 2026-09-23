package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.NCEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NCEvidenceRepository extends JpaRepository<NCEvidence, Long> {
    List<NCEvidence> findByNcIdOrderBySubmissionNumberDesc(Long ncId);

    Optional<NCEvidence> findByNcIdAndSubmissionNumber(Long ncId, Integer submissionNumber);

    @Query("SELECT MAX(e.submissionNumber) FROM NCEvidence e WHERE e.ncId = ?1")
    Optional<Integer> findMaxSubmissionNumber(Long ncId);

    List<NCEvidence> findByAuditorReviewStatusAndNcId(String status, Long ncId);
}
