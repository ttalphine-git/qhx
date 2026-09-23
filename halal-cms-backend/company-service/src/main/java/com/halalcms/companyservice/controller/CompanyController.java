package com.halalcms.companyservice.controller;

import com.halalcms.companyservice.dto.CompanyRequest;
import com.halalcms.companyservice.dto.CompanyResponse;
import com.halalcms.companyservice.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    public ResponseEntity<CompanyResponse> create(
            @AuthenticationPrincipal String ownerId,
            @Valid @RequestBody CompanyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.create(UUID.fromString(ownerId), req));
    }

    @GetMapping("/me")
    public ResponseEntity<CompanyResponse> getMyCompany(@AuthenticationPrincipal String ownerId) {
        return ResponseEntity.ok(companyService.getByOwner(UUID.fromString(ownerId)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CompanyResponse> getByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(companyService.getByOwner(UUID.fromString(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(companyService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<CompanyResponse>> listAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(companyService.listAll(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal String ownerId,
            @Valid @RequestBody CompanyRequest req) {
        return ResponseEntity.ok(companyService.update(id, UUID.fromString(ownerId), req));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CompanyResponse> partialUpdate(
            @PathVariable UUID id,
            @RequestBody CompanyRequest req) {
        return ResponseEntity.ok(companyService.partialUpdate(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
