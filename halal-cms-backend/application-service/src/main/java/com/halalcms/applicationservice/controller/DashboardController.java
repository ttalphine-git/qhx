package com.halalcms.applicationservice.controller;

import com.halalcms.applicationservice.dto.*;
import com.halalcms.applicationservice.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/pending/tasks")
    public ResponseEntity<PendingTaskDto> getPendingTasks(
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dashboardService.getPendingTasks(statuses, country, page, size));
    }

    @GetMapping("/applications/stage")
    public ResponseEntity<ApplicationStagesResultDto> getApplicationStages(
            @RequestParam(required = false) String country) {
        return ResponseEntity.ok(dashboardService.getApplicationStages(country));
    }

    @GetMapping("/monthly/revenues")
    public ResponseEntity<MonthlyRevenueDto> getMonthlyRevenues(
            @RequestParam(required = false) String country) {
        return ResponseEntity.ok(dashboardService.getMonthlyRevenues(country));
    }

    @GetMapping("/recent/events")
    public ResponseEntity<EventLogsPageDto> getRecentEvents(
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dashboardService.getRecentEvents(country, page, size));
    }
}
