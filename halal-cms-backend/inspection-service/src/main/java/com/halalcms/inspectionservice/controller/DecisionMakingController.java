package com.halalcms.inspectionservice.controller;

import com.halalcms.inspectionservice.model.DecisionRequest;
import com.halalcms.inspectionservice.service.DecisionMakingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/decisions")
@RequiredArgsConstructor
@Slf4j
public class DecisionMakingController {

    private final DecisionMakingService decisionMakingService;

    @PostMapping("/assign")
    public ResponseEntity<DecisionRequest> assignDecisionRequest(
        @RequestBody Map<String, Object> request
    ) {
        log.info("POST /api/decisions/assign");
        Long auditId = ((Number) request.get("auditId")).longValue();
        Long applicationId = ((Number) request.get("applicationId")).longValue();
        Long assignedTo = ((Number) request.get("assignedTo")).longValue();
        String decisionType = (String) request.get("decisionType");

        DecisionRequest result = decisionMakingService.assignDecisionRequest(auditId, applicationId, assignedTo, decisionType);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/{requestId}/decide")
    public ResponseEntity<DecisionRequest> submitDecision(
        @PathVariable Long requestId,
        @RequestBody Map<String, String> request,
        Authentication auth
    ) {
        log.info("POST /api/decisions/{}/decide", requestId);
        Long decidedBy = extractUserId(auth);
        String decision = request.get("decision");
        String reasoning = request.get("reasoning");
        String conditions = request.get("conditions");

        DecisionRequest result = decisionMakingService.submitDecision(requestId, decision, reasoning, conditions, decidedBy);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<DecisionRequest>> getMyDecisionRequests(Authentication auth) {
        log.info("GET /api/decisions/my-requests");
        Long userId = extractUserId(auth);
        List<DecisionRequest> result = decisionMakingService.getDecisionRequestsForUser(userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/audit/{auditId}")
    public ResponseEntity<List<DecisionRequest>> getAuditDecisions(@PathVariable Long auditId) {
        log.info("GET /api/decisions/audit/{}", auditId);
        List<DecisionRequest> result = decisionMakingService.getAuditDecisions(auditId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<DecisionRequest> getDecisionRequest(@PathVariable Long requestId) {
        log.info("GET /api/decisions/{}", requestId);
        DecisionRequest result = decisionMakingService.getDecisionRequest(requestId);
        return ResponseEntity.ok(result);
    }

    private Long extractUserId(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof String) {
            return Long.parseLong(auth.getPrincipal().toString());
        }
        return 1L;
    }
}
