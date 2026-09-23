package com.halalcms.certificateservice.controller;

import com.halalcms.certificateservice.dto.CertificateDto;
import com.halalcms.certificateservice.dto.CertificatesPageableDTO;
import com.halalcms.certificateservice.dto.CreateCertificateRequest;
import com.halalcms.certificateservice.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    /**
     * GET /certificates?page=0&size=20&search=
     * Returns a paginated list of certificates, optionally filtered by company name.
     * Accessible by any authenticated user.
     */
    @GetMapping
    public ResponseEntity<CertificatesPageableDTO> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String search) {
        return ResponseEntity.ok(certificateService.list(page, size, search));
    }

    /**
     * GET /certificates/{key}
     * Returns a single certificate by its certificateKey (e.g. "CERT-2024-0001").
     * Accessible by any authenticated user.
     */
    @GetMapping("/{key}")
    public ResponseEntity<CertificateDto> getByKey(@PathVariable String key) {
        return ResponseEntity.ok(certificateService.getByKey(key));
    }

    /**
     * POST /certificates
     * Issues a new certificate from an approved application.
     * Restricted to OFFICE roles only.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OFFICE_ADMIN', 'OFFICE_OFFICER', 'OFFICE_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<CertificateDto> create(@Valid @RequestBody CreateCertificateRequest req) {
        CertificateDto created = certificateService.createFromApplication(
                req.getApplicationId(),
                req.getCompanyName(),
                req.getHalalStandard(),
                req.getIssuedBy()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
