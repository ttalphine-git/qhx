package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.*;
import com.halalcms.applicationservice.model.Application;
import com.halalcms.applicationservice.model.ApplicationStatus;
import com.halalcms.applicationservice.model.EventLog;
import com.halalcms.applicationservice.repository.ApplicationRepository;
import com.halalcms.applicationservice.repository.EventLogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private static final List<ApplicationStatus> PENDING_STATUSES = Arrays.asList(
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.AGREEMENT_REVIEW,
            ApplicationStatus.PAYMENT_REVIEW,
            ApplicationStatus.DOCUMENT_SUBMISSION,
            ApplicationStatus.NC_CLEARANCE,
            ApplicationStatus.DECISION_MAKING,
            ApplicationStatus.CERTIFICATION_REVIEW
    );

    private final ApplicationRepository applicationRepository;
    private final EventLogRepository eventLogRepository;
    private final EventLogService eventLogService;

    public PendingTaskDto getPendingTasks(String statuses, String country, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

        Specification<Application> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by provided statuses or default pending statuses
            if (statuses != null && !statuses.isBlank()) {
                List<String> statusList = Arrays.stream(statuses.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                predicates.add(root.get("status").as(String.class).in(statusList));
            } else {
                List<String> defaultStatuses = PENDING_STATUSES.stream()
                        .map(ApplicationStatus::name)
                        .toList();
                predicates.add(root.get("status").as(String.class).in(defaultStatuses));
            }

            if (country != null && !country.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("country")), country.toLowerCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Application> result = applicationRepository.findAll(spec, pageable);

        List<PendingTaskItem> items = result.getContent().stream().map(a -> PendingTaskItem.builder()
                .id(a.getId())
                .applicationId(a.getId())
                .applicationNumber(a.getApplicationNumber())
                .companyName(a.getCompanyName())
                .taskType(a.getStatus().name())
                .status(a.getStatus().name())
                .priority(resolvePriority(a.getStatus()))
                .dueDate(null)
                .description("Application requires action: " + a.getStatus().name())
                .assignedTo(a.getAssignedAuditorName())
                .build()).toList();

        return PendingTaskDto.builder()
                .content(items)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    public ApplicationStagesResultDto getApplicationStages(String country) {
        Specification<Application> spec = (root, query, cb) -> {
            if (country != null && !country.isBlank()) {
                return cb.equal(cb.lower(root.get("country")), country.toLowerCase());
            }
            return cb.conjunction();
        };

        List<Application> applications = applicationRepository.findAll(spec);

        Map<String, Long> grouped = applications.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()));

        List<ApplicationStageCount> stages = Arrays.stream(ApplicationStatus.values())
                .map(s -> ApplicationStageCount.builder()
                        .status(s.name())
                        .count(grouped.getOrDefault(s.name(), 0L))
                        .build())
                .toList();

        long total = applications.size();

        return ApplicationStagesResultDto.builder()
                .stages(stages)
                .total(total)
                .build();
    }

    public MonthlyRevenueDto getMonthlyRevenues(String country) {
        // Group event_logs where newStatus = CERTIFIED by month, count per month
        List<EventLog> certifiedEvents = eventLogRepository.findAll()
                .stream()
                .filter(e -> ApplicationStatus.CERTIFIED.name().equals(e.getNewStatus()))
                .toList();

        // Apply country filter via application lookup if needed
        Map<String, Long> monthCounts = certifiedEvents.stream()
                .filter(e -> e.getPerformedAt() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getPerformedAt().format(MONTH_FORMATTER),
                        Collectors.counting()
                ));

        List<MonthlyData> data = monthCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> MonthlyData.builder()
                        .month(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .toList();

        long total = data.stream().mapToLong(MonthlyData::getValue).sum();

        return MonthlyRevenueDto.builder()
                .data(data)
                .total(total)
                .build();
    }

    public EventLogsPageDto getRecentEvents(String country, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "performedAt"));

        Page<EventLog> result = eventLogRepository.findAll(pageable);

        return EventLogsPageDto.builder()
                .content(result.getContent().stream().map(eventLogService::toDto).toList())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(result.getNumber())
                .size(result.getSize())
                .build();
    }

    private String resolvePriority(ApplicationStatus status) {
        return switch (status) {
            case SUBMITTED, PAYMENT_REVIEW, CERTIFICATION_REVIEW -> "HIGH";
            case UNDER_REVIEW, AGREEMENT_REVIEW, DECISION_MAKING -> "MEDIUM";
            default -> "LOW";
        };
    }
}
