package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.EventLogDto;
import com.halalcms.applicationservice.dto.EventLogsPageDto;
import com.halalcms.applicationservice.model.EventLog;
import com.halalcms.applicationservice.repository.EventLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional
public class EventLogService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final EventLogRepository eventLogRepository;

    @Transactional(readOnly = true)
    public EventLogsPageDto getByApplication(Long applicationId, int page, int size) {
        Page<EventLog> result = eventLogRepository
                .findByApplicationIdOrderByPerformedAtDesc(applicationId, PageRequest.of(page, size));
        return EventLogsPageDto.builder()
                .content(result.getContent().stream().map(this::toDto).toList())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(result.getNumber())
                .size(result.getSize())
                .build();
    }

    public void log(Long applicationId, String event, String description,
                    String performedBy, String oldStatus, String newStatus) {
        EventLog log = EventLog.builder()
                .applicationId(applicationId)
                .event(event)
                .description(description)
                .performedBy(performedBy)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .build();
        eventLogRepository.save(log);
    }

    public EventLogDto toDto(EventLog log) {
        return EventLogDto.builder()
                .id(log.getId())
                .applicationId(log.getApplicationId())
                .event(log.getEvent())
                .description(log.getDescription())
                .performedBy(log.getPerformedBy())
                .performedAt(log.getPerformedAt() != null ? log.getPerformedAt().format(FORMATTER) : null)
                .oldStatus(log.getOldStatus())
                .newStatus(log.getNewStatus())
                .build();
    }
}
