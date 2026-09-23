package com.halalcms.companyservice.controller;

import com.halalcms.companyservice.dto.FactoryRequest;
import com.halalcms.companyservice.dto.FactoryResponse;
import com.halalcms.companyservice.dto.PageResponse;
import com.halalcms.companyservice.service.FactoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/factories")
@RequiredArgsConstructor
public class FactoryController {

    private final FactoryService factoryService;

    @PostMapping
    public ResponseEntity<FactoryResponse> create(
            @PathVariable UUID companyId,
            @Valid @RequestBody FactoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(factoryService.create(companyId, req));
    }

    @GetMapping
    public ResponseEntity<PageResponse<FactoryResponse>> list(
            @PathVariable UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(factoryService.listByCompany(companyId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FactoryResponse> getById(@PathVariable UUID companyId, @PathVariable UUID id) {
        return ResponseEntity.ok(factoryService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FactoryResponse> update(
            @PathVariable UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody FactoryRequest req) {
        return ResponseEntity.ok(factoryService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID companyId, @PathVariable UUID id) {
        factoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
