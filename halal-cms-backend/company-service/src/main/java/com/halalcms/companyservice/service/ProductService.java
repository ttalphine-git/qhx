package com.halalcms.companyservice.service;

import com.halalcms.companyservice.dto.PageResponse;
import com.halalcms.companyservice.dto.ProductRequest;
import com.halalcms.companyservice.dto.ProductResponse;
import com.halalcms.companyservice.model.Product;
import com.halalcms.companyservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductResponse create(UUID companyId, ProductRequest req) {
        Product product = Product.builder()
                .companyId(companyId)
                .factoryId(req.getFactoryId())
                .name(req.getName())
                .sku(req.getSku())
                .brand(req.getBrand())
                .category(req.getCategory())
                .description(req.getDescription())
                .ingredients(req.getIngredients() != null ? req.getIngredients() : new ArrayList<>())
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> listByCompany(UUID companyId, int page, int size) {
        Page<Product> p = productRepository.findByCompanyId(companyId, PageRequest.of(page, size));
        return PageResponse.<ProductResponse>builder()
                .content(p.getContent().stream().map(this::toResponse).toList())
                .page(page)
                .size(size)
                .totalElements(p.getTotalElements())
                .totalPages(p.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public ProductResponse update(UUID id, ProductRequest req) {
        Product product = findOrThrow(id);
        product.setName(req.getName());
        product.setSku(req.getSku());
        product.setBrand(req.getBrand());
        product.setCategory(req.getCategory());
        product.setDescription(req.getDescription());
        product.setIngredients(req.getIngredients() != null ? req.getIngredients() : new ArrayList<>());
        product.setFactoryId(req.getFactoryId());
        return toResponse(productRepository.save(product));
    }

    public void delete(UUID id) {
        productRepository.delete(findOrThrow(id));
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .companyId(p.getCompanyId())
                .factoryId(p.getFactoryId())
                .name(p.getName())
                .sku(p.getSku())
                .brand(p.getBrand())
                .category(p.getCategory())
                .description(p.getDescription())
                .ingredients(new ArrayList<>(p.getIngredients()))
                .halalStatus(p.getHalalStatus())
                .certificationNumber(p.getCertificationNumber())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
