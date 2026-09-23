package com.halalcms.applicationservice.controller;

import com.halalcms.applicationservice.dto.EventLogsPageDto;
import com.halalcms.applicationservice.service.EventLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/audits")
@RequiredArgsConstructor
public class EventLogController {

    private final EventLogService eventLogService;

    @GetMapping("/eventlogs/{applicationId}")
    public ResponseEntity<EventLogsPageDto> getEventLogs(
            @PathVariable Long applicationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(eventLogService.getByApplication(applicationId, page, size));
    }
}
