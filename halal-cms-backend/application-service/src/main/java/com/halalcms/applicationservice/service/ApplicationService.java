package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.ApplicationResponseDTO;
import com.halalcms.applicationservice.dto.ApplicationSmallResponseDTO;
import com.halalcms.applicationservice.dto.ApplicationsPageableDTO;
import com.halalcms.applicationservice.model.Application;
import com.halalcms.applicationservice.model.ApplicationStatus;
import com.halalcms.applicationservice.model.ApplicationType;
import com.halalcms.applicationservice.repository.ApplicationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final ApplicationRepository applicationRepository;
    private final EventLogService eventLogService;
    private final ObjectMapper objectMapper;

    public ApplicationResponseDTO create(String userId) {
        return create(userId, Map.of());
    }

    public ApplicationResponseDTO create(String userId, Map<String, Object> payload) {
        long count = applicationRepository.count();
        int year = LocalDateTime.now().getYear();
        String applicationNumber = "APP-" + year + "-" + String.format("%04d", count + 1);
        ApplicationStatus status = parseStatus(payload.get("status"));

        Application application = Application.builder()
                .applicationNumber(applicationNumber)
                .status(status)
                .type(ApplicationType.NEW)
                .userId(userId)
                .companyName(asString(payload.get("companyName")))
                .country(firstString(payload.get("selectedMarkets")))
                .halalStandard(firstString(payload.get("selectedStandards")))
                .productCount(listSize(payload.get("products")))
                .payloadJson(toPayloadJson(payload))
                .submittedAt(status == ApplicationStatus.SUBMITTED ? LocalDateTime.now() : null)
                .build();

        Application saved = applicationRepository.save(application);

        eventLogService.log(
                saved.getId(),
                status.name(),
                status == ApplicationStatus.SUBMITTED ? "Application submitted" : "Application created",
                userId,
                null,
                status.name()
        );

        return toDto(saved);
    }

    private ApplicationStatus parseStatus(Object value) {
        String raw = asString(value);
        if (raw == null || raw.isBlank()) return ApplicationStatus.DRAFT;
        try {
            return ApplicationStatus.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return ApplicationStatus.DRAFT;
        }
    }

    private String asString(Object value) {
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private String firstString(Object value) {
        if (value instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof String s) return s;
        return asString(value);
    }

    private Integer listSize(Object value) {
        return value instanceof List<?> list ? list.size() : null;
    }

    private String toPayloadJson(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Application payload is not valid JSON");
        }
    }

    @Transactional(readOnly = true)
    public ApplicationsPageableDTO list(String statuses, String search, int page, int size,
                                        String userId, String role) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Application> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Role-based filtering: CUSTOMER only sees their own applications
            if (role != null && role.startsWith("CUSTOMER")) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }

            // Filter by comma-separated statuses
            if (statuses != null && !statuses.isBlank()) {
                List<String> statusList = Arrays.stream(statuses.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                if (!statusList.isEmpty()) {
                    predicates.add(root.get("status").as(String.class).in(statusList));
                }
            }

            // Search by companyName or applicationNumber
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                Predicate byCompany = cb.like(cb.lower(root.get("companyName")), pattern);
                Predicate byNumber = cb.like(cb.lower(root.get("applicationNumber")), pattern);
                predicates.add(cb.or(byCompany, byNumber));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Application> result = applicationRepository.findAll(spec, pageable);

        return ApplicationsPageableDTO.builder()
                .content(result.getContent().stream().map(this::toDto).toList())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(result.getNumber())
                .size(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public ApplicationResponseDTO getById(Long id) {
        return toDto(findOrThrow(id));
    }

    public ApplicationResponseDTO updateStatus(Long id, ApplicationStatus newStatus) {
        Application application = findOrThrow(id);
        String oldStatus = application.getStatus().name();

        application.setStatus(newStatus);

        if (newStatus == ApplicationStatus.SUBMITTED) {
            application.setSubmittedAt(LocalDateTime.now());
        }

        Application saved = applicationRepository.save(application);

        String performedBy = getCurrentUserId();
        eventLogService.log(
                saved.getId(),
                newStatus.name(),
                "Status changed from " + oldStatus + " to " + newStatus.name(),
                performedBy,
                oldStatus,
                newStatus.name()
        );

        return toDto(saved);
    }

    public void delete(Long id) {
        Application application = findOrThrow(id);
        applicationRepository.delete(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationSmallResponseDTO> listSmall() {
        return applicationRepository.findAll().stream()
                .map(a -> ApplicationSmallResponseDTO.builder()
                        .id(a.getId())
                        .applicationNumber(a.getApplicationNumber())
                        .status(a.getStatus().name())
                        .companyName(a.getCompanyName())
                        .build())
                .toList();
    }

    private Application findOrThrow(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Application not found with id: " + id));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? (String) auth.getPrincipal() : "system";
    }

    private ApplicationResponseDTO toDto(Application a) {
        return ApplicationResponseDTO.builder()
                .id(a.getId())
                .applicationNumber(a.getApplicationNumber())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .type(a.getType() != null ? a.getType().name() : null)
                .companyName(a.getCompanyName())
                .createdAt(a.getCreatedAt() != null ? a.getCreatedAt().format(FORMATTER) : null)
                .updatedAt(a.getUpdatedAt() != null ? a.getUpdatedAt().format(FORMATTER) : null)
                .submittedAt(a.getSubmittedAt() != null ? a.getSubmittedAt().format(FORMATTER) : null)
                .userId(a.getUserId())
                .assignedAuditorId(a.getAssignedAuditorId())
                .assignedAuditorName(a.getAssignedAuditorName())
                .halalStandard(a.getHalalStandard())
                .country(a.getCountry())
                .productCount(a.getProductCount())
                .payloadJson(a.getPayloadJson())
                .build();
    }
}
