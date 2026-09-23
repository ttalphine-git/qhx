package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.dto.*;
import com.halalcms.inspectionservice.model.*;
import com.halalcms.inspectionservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuditReportService {

    private final AuditReportConfigurationRepository configurationRepository;
    private final AuditQuestionRepository questionRepository;
    private final AuditReportRepository reportRepository;

    @Transactional(readOnly = true)
    public List<AuditReportConfigurationDto> getConfigurations() {
        return configurationRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(this::toConfigurationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditReportConfigurationDto getByActivityCategory(String categoryKey) {
        return getConfigurations().stream()
                .filter(c -> c.getActivityCategoryKeys() != null && c.getActivityCategoryKeys().contains(categoryKey))
                .findFirst()
                .orElseGet(() -> getConfigurations().stream().findFirst().orElse(null));
    }

    @Transactional
    public List<AuditReportConfigurationDto> saveConfigurations(List<AuditReportConfigurationDto> requests) {
        Set<Long> touched = new HashSet<>();
        int order = 0;
        for (AuditReportConfigurationDto request : requests) {
            AuditReportConfiguration config = request.getId() != null
                    ? configurationRepository.findById(request.getId()).orElseGet(AuditReportConfiguration::new)
                    : new AuditReportConfiguration();

            config.setName(nullToDefault(request.getName(), "Audit Configuration"));
            config.setReportTitle(nullToDefault(request.getReportTitle(), config.getName()));
            config.setAppliesTo(request.getAppliesTo());
            config.setActivityCategoryKeys(join(request.getActivityCategoryKeys()));
            config.setRiskLevel(nullToDefault(request.getRiskLevel(), "Standard"));
            config.setFormCode(request.getFormCode());
            config.setRevision(request.getRevision());
            config.setStages(join(request.getStages()));
            config.setActive(request.getActive() == null || request.getActive());
            config.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : order);

            config.getQuestions().clear();
            List<AuditQuestionDto> questions = request.getQuestions() == null ? List.of() : request.getQuestions();
            for (int i = 0; i < questions.size(); i++) {
                AuditQuestionDto questionDto = questions.get(i);
                if (questionDto.getQuestionText() == null || questionDto.getQuestionText().isBlank()) continue;
                AuditQuestion question = AuditQuestion.builder()
                        .configuration(config)
                        .questionText(questionDto.getQuestionText())
                        .sortOrder(questionDto.getSortOrder() != null ? questionDto.getSortOrder() : i)
                        .build();
                config.getQuestions().add(question);
            }

            AuditReportConfiguration saved = configurationRepository.save(config);
            touched.add(saved.getId());
            order++;
        }

        configurationRepository.findAll().forEach(config -> {
            if (!touched.contains(config.getId())) {
                config.setActive(false);
                configurationRepository.save(config);
            }
        });

        return getConfigurations();
    }

    @Transactional
    public ApplicationAuditReportDto getReportForApplication(Long applicationId, String activityCategoryKey) {
        AuditReport report = reportRepository.findByApplicationId(applicationId)
                .orElseGet(() -> createReport(applicationId, activityCategoryKey));
        if ((report.getConfiguration() == null || report.getActivityCategoryKey() == null) && activityCategoryKey != null) {
            applyConfiguration(report, activityCategoryKey);
            report = reportRepository.save(report);
        }
        return toReportDto(report);
    }

    @Transactional
    public ApplicationAuditReportDto saveReportForApplication(Long applicationId, ApplicationAuditReportDto request) {
        AuditReport report = reportRepository.findByApplicationId(applicationId)
                .orElseGet(() -> AuditReport.builder().applicationId(applicationId).build());

        report.setActivityCategoryKey(request.getActivityCategoryKey());
        report.setStatus(nullToDefault(request.getStatus(), "DRAFT"));
        report.setGeneralComment(request.getGeneralComment());
        report.setCompletedAt("COMPLETED".equalsIgnoreCase(request.getStatus()) ? LocalDateTime.now() : request.getCompletedAt());

        if (request.getConfigurationId() != null) {
            configurationRepository.findById(request.getConfigurationId()).ifPresent(report::setConfiguration);
        } else if (request.getActivityCategoryKey() != null) {
            applyConfiguration(report, request.getActivityCategoryKey());
        }

        report.getAnswers().clear();
        List<AuditAnswerDto> answers = request.getAnswers() == null ? List.of() : request.getAnswers();
        for (AuditAnswerDto answerDto : answers) {
            if (answerDto.getQuestionText() == null || answerDto.getQuestionText().isBlank()) continue;
            AuditQuestion question = answerDto.getQuestionId() == null ? null : questionRepository.findById(answerDto.getQuestionId()).orElse(null);
            AuditAnswer answer = AuditAnswer.builder()
                    .report(report)
                    .question(question)
                    .questionText(answerDto.getQuestionText())
                    .answer(answerDto.getAnswer())
                    .finding(answerDto.getFinding())
                    .customerComment(answerDto.getCustomerComment())
                    .auditorComment(answerDto.getAuditorComment())
                    .shariaComment(answerDto.getShariaComment())
                    .build();
            report.getAnswers().add(answer);
        }

        return toReportDto(reportRepository.save(report));
    }

    private AuditReport createReport(Long applicationId, String activityCategoryKey) {
        AuditReport report = AuditReport.builder()
                .applicationId(applicationId)
                .activityCategoryKey(activityCategoryKey)
                .status("DRAFT")
                .build();
        applyConfiguration(report, activityCategoryKey);
        return reportRepository.save(report);
    }

    private void applyConfiguration(AuditReport report, String activityCategoryKey) {
        List<AuditReportConfiguration> configs = configurationRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
        AuditReportConfiguration config = configs.stream()
                .filter(c -> split(c.getActivityCategoryKeys()).contains(activityCategoryKey))
                .findFirst()
                .orElse(configs.isEmpty() ? null : configs.get(0));
        report.setConfiguration(config);
        report.setActivityCategoryKey(activityCategoryKey);
    }

    private AuditReportConfigurationDto toConfigurationDto(AuditReportConfiguration config) {
        return AuditReportConfigurationDto.builder()
                .id(config.getId())
                .name(config.getName())
                .reportTitle(config.getReportTitle())
                .appliesTo(config.getAppliesTo())
                .activityCategoryKeys(split(config.getActivityCategoryKeys()))
                .riskLevel(config.getRiskLevel())
                .formCode(config.getFormCode())
                .revision(config.getRevision())
                .stages(split(config.getStages()))
                .active(config.getActive())
                .sortOrder(config.getSortOrder())
                .questions(config.getQuestions().stream().map(q -> AuditQuestionDto.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .sortOrder(q.getSortOrder())
                        .build()).toList())
                .build();
    }

    private ApplicationAuditReportDto toReportDto(AuditReport report) {
        return ApplicationAuditReportDto.builder()
                .id(report.getId())
                .applicationId(report.getApplicationId())
                .configurationId(report.getConfiguration() != null ? report.getConfiguration().getId() : null)
                .activityCategoryKey(report.getActivityCategoryKey())
                .status(report.getStatus())
                .generalComment(report.getGeneralComment())
                .completedAt(report.getCompletedAt())
                .configuration(report.getConfiguration() != null ? toConfigurationDto(report.getConfiguration()) : null)
                .answers(report.getAnswers().stream().map(a -> AuditAnswerDto.builder()
                        .id(a.getId())
                        .questionId(a.getQuestion() != null ? a.getQuestion().getId() : null)
                        .questionText(a.getQuestionText())
                        .answer(a.getAnswer())
                        .finding(a.getFinding())
                        .customerComment(a.getCustomerComment())
                        .auditorComment(a.getAuditorComment())
                        .shariaComment(a.getShariaComment())
                        .build()).toList())
                .build();
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split("\\|", -1)).filter(s -> !s.isBlank()).toList();
    }

    private String join(List<String> values) {
        if (values == null) return "";
        return String.join("|", values.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isBlank()).toList());
    }

    private String nullToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
