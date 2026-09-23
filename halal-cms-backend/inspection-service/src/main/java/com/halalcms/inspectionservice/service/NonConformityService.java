package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.NonConformityResponse;
import com.halalcms.inspectionservice.model.NonConformity;
import com.halalcms.inspectionservice.repository.NonConformityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NonConformityService {

    private final NonConformityRepository nonConformityRepository;

    public List<NonConformityResponse> getByApplication(Long applicationId) {
        return nonConformityRepository.findByApplicationId(applicationId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private NonConformityResponse toResponse(NonConformity nc) {
        return NonConformityResponse.builder()
                .id(nc.getId())
                .applicationId(nc.getApplicationId())
                .category(nc.getCategory())
                .description(nc.getDescription())
                .severity(nc.getSeverity())
                .status(nc.getStatus())
                .createdAt(nc.getCreatedAt() != null ? nc.getCreatedAt().toString() : null)
                .updatedAt(nc.getUpdatedAt() != null ? nc.getUpdatedAt().toString() : null)
                .resolvedAt(nc.getResolvedAt() != null ? nc.getResolvedAt().toString() : null)
                .build();
    }
}
