package com.halalcms.companyservice.service;

import com.halalcms.companyservice.dto.FactoryRequest;
import com.halalcms.companyservice.dto.FactoryResponse;
import com.halalcms.companyservice.dto.PageResponse;
import com.halalcms.companyservice.model.Factory;
import com.halalcms.companyservice.repository.FactoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class FactoryService {

    private final FactoryRepository factoryRepository;

    public FactoryResponse create(UUID companyId, FactoryRequest req) {
        Factory factory = Factory.builder()
                .companyId(companyId)
                .name(req.getName())
                .factoryType(req.getFactoryType())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .postcode(req.getPostcode())
                .country(req.getCountry())
                .phone(req.getPhone())
                .pic(req.getPic())
                .picPhone(req.getPicPhone())
                .notes(req.getNotes())
                .build();
        return toResponse(factoryRepository.save(factory));
    }

    @Transactional(readOnly = true)
    public PageResponse<FactoryResponse> listByCompany(UUID companyId, int page, int size) {
        Page<Factory> p = factoryRepository.findByCompanyId(companyId, PageRequest.of(page, size));
        return PageResponse.<FactoryResponse>builder()
                .content(p.getContent().stream().map(this::toResponse).toList())
                .page(page)
                .size(size)
                .totalElements(p.getTotalElements())
                .totalPages(p.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public FactoryResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public FactoryResponse update(UUID id, FactoryRequest req) {
        Factory factory = findOrThrow(id);
        factory.setName(req.getName());
        factory.setFactoryType(req.getFactoryType());
        factory.setAddress(req.getAddress());
        factory.setCity(req.getCity());
        factory.setState(req.getState());
        factory.setPostcode(req.getPostcode());
        factory.setCountry(req.getCountry());
        factory.setPhone(req.getPhone());
        factory.setPic(req.getPic());
        factory.setPicPhone(req.getPicPhone());
        factory.setNotes(req.getNotes());
        return toResponse(factoryRepository.save(factory));
    }

    public void delete(UUID id) {
        factoryRepository.delete(findOrThrow(id));
    }

    private Factory findOrThrow(UUID id) {
        return factoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Factory not found"));
    }

    private FactoryResponse toResponse(Factory f) {
        return FactoryResponse.builder()
                .id(f.getId())
                .companyId(f.getCompanyId())
                .name(f.getName())
                .factoryType(f.getFactoryType())
                .address(f.getAddress())
                .city(f.getCity())
                .state(f.getState())
                .postcode(f.getPostcode())
                .country(f.getCountry())
                .phone(f.getPhone())
                .pic(f.getPic())
                .picPhone(f.getPicPhone())
                .notes(f.getNotes())
                .status(f.getStatus())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
