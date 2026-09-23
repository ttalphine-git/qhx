package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.RecommendationResponse;
import com.halalcms.inspectionservice.model.Recommendation;
import com.halalcms.inspectionservice.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;

    public List<RecommendationResponse> getByApplication(Long applicationId) {
        return recommendationRepository.findByApplicationId(applicationId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private RecommendationResponse toResponse(Recommendation r) {
        return RecommendationResponse.builder()
                .id(r.getId())
                .applicationId(r.getApplicationId())
                .text(r.getText())
                .priority(r.getPriority())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .createdBy(r.getCreatedBy())
                .build();
    }
}
