package com.halalcms.certificateservice.service;

import com.halalcms.certificateservice.dto.CertificateDto;
import com.halalcms.certificateservice.dto.CertificatesPageableDTO;
import com.halalcms.certificateservice.model.Certificate;
import com.halalcms.certificateservice.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificateService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final CertificateRepository certificateRepository;

    @Transactional(readOnly = true)
    public CertificatesPageableDTO list(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Certificate> resultPage;

        if (StringUtils.hasText(search)) {
            resultPage = certificateRepository.findByCompanyNameContainingIgnoreCase(search.trim(), pageable);
        } else {
            resultPage = certificateRepository.findAll(pageable);
        }

        List<CertificateDto> content = resultPage.getContent()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return CertificatesPageableDTO.builder()
                .content(content)
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .page(resultPage.getNumber())
                .size(resultPage.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public CertificateDto getByKey(String key) {
        Certificate certificate = certificateRepository.findByCertificateKey(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Certificate not found with key: " + key));
        return toDto(certificate);
    }

    public CertificateDto createFromApplication(Long applicationId,
                                                String companyName,
                                                String halalStandard,
                                                String issuedBy) {
        int year = LocalDate.now().getYear();
        long count = certificateRepository.count();

        String certificateKey    = "CERT-" + year + "-" + String.format("%04d", count + 1);
        String certificateNumber = "HCS/" + year + "/" + String.format("%03d", count + 1);

        LocalDate issueDate  = LocalDate.now();
        LocalDate expiryDate = issueDate.plusYears(1);

        Certificate certificate = Certificate.builder()
                .certificateKey(certificateKey)
                .applicationId(applicationId)
                .companyName(companyName)
                .certificateNumber(certificateNumber)
                .issueDate(issueDate)
                .expiryDate(expiryDate)
                .status("ACTIVE")
                .halalStandard(halalStandard)
                .issuedBy(issuedBy)
                .build();

        return toDto(certificateRepository.save(certificate));
    }

    // -------------------------------------------------------------------------
    // Mapping helper
    // -------------------------------------------------------------------------

    private CertificateDto toDto(Certificate c) {
        List<String> productList = Collections.emptyList();
        if (StringUtils.hasText(c.getProducts())) {
            productList = Arrays.stream(c.getProducts().split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toList());
        }

        return CertificateDto.builder()
                .id(c.getId())
                .key(c.getCertificateKey())
                .applicationId(c.getApplicationId())
                .companyName(c.getCompanyName())
                .certificateNumber(c.getCertificateNumber())
                .issueDate(c.getIssueDate() != null ? c.getIssueDate().format(DATE_FMT) : null)
                .expiryDate(c.getExpiryDate() != null ? c.getExpiryDate().format(DATE_FMT) : null)
                .status(c.getStatus())
                .halalStandard(c.getHalalStandard())
                .products(productList)
                .issuedBy(c.getIssuedBy())
                .build();
    }
}
