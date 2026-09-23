package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.HcbAccreditationScopeDto;
import com.halalcms.applicationservice.dto.HcbAccreditationScopeRequest;
import com.halalcms.applicationservice.model.HcbAccreditationScope;
import com.halalcms.applicationservice.repository.HcbAccreditationScopeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HcbAccreditationScopeService {

    private final HcbAccreditationScopeRepository repository;

    @Transactional(readOnly = true)
    public List<HcbAccreditationScopeDto> list() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    public HcbAccreditationScopeDto create(HcbAccreditationScopeRequest req) {
        HcbAccreditationScope scope = HcbAccreditationScope.builder().build();
        apply(scope, req);
        return toDto(repository.save(scope));
    }

    public HcbAccreditationScopeDto update(Long id, HcbAccreditationScopeRequest req) {
        HcbAccreditationScope scope = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Accreditation scope not found"));
        apply(scope, req);
        return toDto(repository.save(scope));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Accreditation scope not found");
        }
        repository.deleteById(id);
    }

    private void apply(HcbAccreditationScope scope, HcbAccreditationScopeRequest req) {
        scope.setBody(req.getBody());
        scope.setStandard(req.getStandard());
        scope.setCertNumber(req.getCertNumber());
        scope.setScope(req.getScope());
        scope.setCountry(req.getCountry());
        scope.setIssueDate(req.getIssueDate());
        scope.setExpiryDate(req.getExpiryDate());
        scope.setCertFileData(req.getCertFileData());
        scope.setCertFileName(req.getCertFileName());
        scope.setNotes(req.getNotes());
        scope.setUnitPrice(req.getUnitPrice() != null ? req.getUnitPrice() : BigDecimal.ZERO);
    }

    private HcbAccreditationScopeDto toDto(HcbAccreditationScope scope) {
        return HcbAccreditationScopeDto.builder()
                .id(scope.getId())
                .body(scope.getBody())
                .standard(scope.getStandard())
                .certNumber(scope.getCertNumber())
                .scope(scope.getScope())
                .country(scope.getCountry())
                .issueDate(scope.getIssueDate())
                .expiryDate(scope.getExpiryDate())
                .certFileData(scope.getCertFileData())
                .certFileName(scope.getCertFileName())
                .notes(scope.getNotes())
                .unitPrice(scope.getUnitPrice())
                .createdAt(scope.getCreatedAt())
                .updatedAt(scope.getUpdatedAt())
                .build();
    }
}
