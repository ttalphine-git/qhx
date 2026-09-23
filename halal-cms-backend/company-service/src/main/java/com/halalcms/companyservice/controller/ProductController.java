package com.halalcms.companyservice.controller;

import com.halalcms.companyservice.dto.PageResponse;
import com.halalcms.companyservice.dto.ProductRequest;
import com.halalcms.companyservice.dto.ProductResponse;
import com.halalcms.companyservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @PathVariable UUID companyId,
            @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.create(companyId, req));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> list(
            @PathVariable UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.listByCompany(companyId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable UUID companyId, @PathVariable UUID id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(
            @PathVariable UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID companyId, @PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
