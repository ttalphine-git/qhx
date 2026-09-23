package com.halalcms.applicationservice.controller;

import com.halalcms.applicationservice.dto.DatabaseRowsDto;
import com.halalcms.applicationservice.dto.DatabaseTableDto;
import com.halalcms.applicationservice.dto.HcbAccreditationScopeDto;
import com.halalcms.applicationservice.dto.HcbAccreditationScopeRequest;
import com.halalcms.applicationservice.service.DatabaseIntrospectionService;
import com.halalcms.applicationservice.service.HcbAccreditationScopeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/system")
@RequiredArgsConstructor
public class SystemController {

    private final DatabaseIntrospectionService databaseIntrospectionService;
    private final HcbAccreditationScopeService accreditationScopeService;

    @GetMapping("/accreditation-scopes")
    public ResponseEntity<List<HcbAccreditationScopeDto>> accreditationScopes() {
        return ResponseEntity.ok(accreditationScopeService.list());
    }

    @PostMapping("/accreditation-scopes")
    public ResponseEntity<HcbAccreditationScopeDto> createAccreditationScope(
            @Valid @RequestBody HcbAccreditationScopeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accreditationScopeService.create(req));
    }

    @PutMapping("/accreditation-scopes/{id}")
    public ResponseEntity<HcbAccreditationScopeDto> updateAccreditationScope(
            @PathVariable("id") Long id,
            @Valid @RequestBody HcbAccreditationScopeRequest req) {
        return ResponseEntity.ok(accreditationScopeService.update(id, req));
    }

    @DeleteMapping("/accreditation-scopes/{id}")
    public ResponseEntity<Void> deleteAccreditationScope(@PathVariable("id") Long id) {
        accreditationScopeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/database/tables")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<DatabaseTableDto>> databaseTables() {
        return ResponseEntity.ok(databaseIntrospectionService.listTables());
    }

    @GetMapping("/database/rows")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DatabaseRowsDto> databaseRows(
            @RequestParam(name = "database", defaultValue = "halalcms_applications") String database,
            @RequestParam(name = "schema") String schema,
            @RequestParam(name = "table") String table,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        return ResponseEntity.ok(databaseIntrospectionService.listRows(database, schema, table, page, size));
    }
}
