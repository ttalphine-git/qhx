package com.halalcms.applicationservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.halalcms.applicationservice.model.NonConformity;
import com.halalcms.applicationservice.model.Observation;
import com.halalcms.applicationservice.repository.NonConformityRepository;
import com.halalcms.applicationservice.repository.ObservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FindingsService {

    private final NonConformityRepository nonConformityRepository;
    private final ObservationRepository observationRepository;
    private final ObjectMapper objectMapper;

    public NonConformity saveNonConformity(Long applicationId, String questionId, String questionText,
                                           String category, Map<String, Object> findingData, String userId) throws Exception {
        log.info("Saving NC for application: {}, question: {}", applicationId, questionId);

        NonConformity nc = NonConformity.builder()
                .applicationId(applicationId)
                .questionId(questionId)
                .questionText(questionText)
                .category(category)
                .ncEvidenceJson(findingData.get("ncEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("ncEvidence")) : null)
                .customerComment((String) findingData.get("customerComment"))
                .customerEvidenceJson(findingData.get("customerEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("customerEvidence")) : null)
                .auditorComment((String) findingData.get("auditorComment"))
                .auditorEvidenceJson(findingData.get("auditorEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("auditorEvidence")) : null)
                .shariaComment((String) findingData.get("shariaComment"))
                .shariaEvidenceJson(findingData.get("shariaEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("shariaEvidence")) : null)
                .createdBy(userId)
                .build();

        return nonConformityRepository.save(nc);
    }

    public Observation saveObservation(Long applicationId, String questionId, String questionText,
                                       String category, Map<String, Object> findingData, String userId) throws Exception {
        log.info("Saving Observation for application: {}, question: {}", applicationId, questionId);

        Observation obs = Observation.builder()
                .applicationId(applicationId)
                .questionId(questionId)
                .questionText(questionText)
                .category(category)
                .obsEvidenceJson(findingData.get("obsEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("obsEvidence")) : null)
                .customerComment((String) findingData.get("customerComment"))
                .customerEvidenceJson(findingData.get("customerEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("customerEvidence")) : null)
                .auditorComment((String) findingData.get("auditorComment"))
                .auditorEvidenceJson(findingData.get("auditorEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("auditorEvidence")) : null)
                .shariaComment((String) findingData.get("shariaComment"))
                .shariaEvidenceJson(findingData.get("shariaEvidence") != null ?
                    objectMapper.writeValueAsString(findingData.get("shariaEvidence")) : null)
                .createdBy(userId)
                .build();

        return observationRepository.save(obs);
    }

    public List<NonConformity> getNonConformities(Long applicationId) {
        return nonConformityRepository.findByApplicationId(applicationId);
    }

    public List<Observation> getObservations(Long applicationId) {
        return observationRepository.findByApplicationId(applicationId);
    }

    public void deleteNonConformity(Long applicationId, String questionId) {
        nonConformityRepository.deleteByApplicationIdAndQuestionId(applicationId, questionId);
    }

    public void deleteObservation(Long applicationId, String questionId) {
        observationRepository.deleteByApplicationIdAndQuestionId(applicationId, questionId);
    }
}
