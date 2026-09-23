package com.halalcms.companyservice.service;

import com.halalcms.companyservice.dto.CompanyRequest;
import com.halalcms.companyservice.dto.CompanyResponse;
import com.halalcms.companyservice.model.Company;
import com.halalcms.companyservice.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyResponse create(UUID ownerId, CompanyRequest req) {
        if (companyRepository.existsByRegistrationNumber(req.getRegistrationNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registration number already exists");
        }
        Company company = Company.builder()
                .ownerId(ownerId)
                .registrationNumber(req.getRegistrationNumber())
                .name(req.getName())
                .businessType(req.getBusinessType())
                .address(req.getAddress())
                .addressLine1(req.getAddressLine1())
                .addressLine2(req.getAddressLine2())
                .city(req.getCity())
                .state(req.getState())
                .postcode(req.getPostcode())
                .country(req.getCountry())
                .phone(req.getPhone())
                .email(req.getEmail())
                .website(req.getWebsite())
                .activityCategory(req.getActivityCategory())
                .specificActivities(req.getSpecificActivities())
                .description(req.getDescription())
                .incorporationDate(req.getIncorporationDate())
                .contactName(req.getContactName())
                .contactDesignation(req.getContactDesignation())
                .employeeCount(req.getEmployeeCount())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .licenseNo(req.getLicenseNo())
                .licenseExpiry(req.getLicenseExpiry())
                .issuingAuthority(req.getIssuingAuthority())
                .licenseFileName(req.getLicenseFileName())
                .licenseFileSize(req.getLicenseFileSize())
                .licenseFileData(req.getLicenseFileData())
                .vatNo(req.getVatNo())
                .sstNo(req.getSstNo())
                .vatFileName(req.getVatFileName())
                .vatFileSize(req.getVatFileSize())
                .vatFileData(req.getVatFileData())
                .build();
        return toResponse(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public CompanyResponse getByOwner(UUID ownerId) {
        Company company = companyRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));
        return toResponse(company);
    }

    @Transactional(readOnly = true)
    public CompanyResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<CompanyResponse> listAll(Pageable pageable) {
        return companyRepository.findAll(pageable).map(this::toResponse);
    }

    public CompanyResponse update(UUID id, UUID requesterId, CompanyRequest req) {
        Company company = findOrThrow(id);
        company.setName(req.getName());
        company.setBusinessType(req.getBusinessType());
        company.setAddress(req.getAddress());
        company.setAddressLine1(req.getAddressLine1());
        company.setAddressLine2(req.getAddressLine2());
        company.setCity(req.getCity());
        company.setState(req.getState());
        company.setPostcode(req.getPostcode());
        company.setCountry(req.getCountry());
        company.setPhone(req.getPhone());
        company.setEmail(req.getEmail());
        company.setWebsite(req.getWebsite());
        company.setActivityCategory(req.getActivityCategory());
        company.setSpecificActivities(req.getSpecificActivities());
        company.setDescription(req.getDescription());
        company.setIncorporationDate(req.getIncorporationDate());
        company.setContactName(req.getContactName());
        company.setContactDesignation(req.getContactDesignation());
        company.setEmployeeCount(req.getEmployeeCount());
        company.setLatitude(req.getLatitude());
        company.setLongitude(req.getLongitude());
        company.setLicenseNo(req.getLicenseNo());
        company.setLicenseExpiry(req.getLicenseExpiry());
        company.setIssuingAuthority(req.getIssuingAuthority());
        company.setLicenseFileName(req.getLicenseFileName());
        company.setLicenseFileSize(req.getLicenseFileSize());
        company.setLicenseFileData(req.getLicenseFileData());
        company.setVatNo(req.getVatNo());
        company.setSstNo(req.getSstNo());
        company.setVatFileName(req.getVatFileName());
        company.setVatFileSize(req.getVatFileSize());
        company.setVatFileData(req.getVatFileData());
        return toResponse(companyRepository.save(company));
    }

    public void delete(UUID id) {
        companyRepository.delete(findOrThrow(id));
    }

    private Company findOrThrow(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Company not found"));
    }

    private CompanyResponse toResponse(Company c) {
        return CompanyResponse.builder()
                .id(c.getId())
                .ownerId(c.getOwnerId())
                .registrationNumber(c.getRegistrationNumber())
                .name(c.getName())
                .businessType(c.getBusinessType())
                .address(c.getAddress())
                .addressLine1(c.getAddressLine1())
                .addressLine2(c.getAddressLine2())
                .city(c.getCity())
                .state(c.getState())
                .postcode(c.getPostcode())
                .country(c.getCountry())
                .phone(c.getPhone())
                .email(c.getEmail())
                .website(c.getWebsite())
                .activityCategory(c.getActivityCategory())
                .specificActivities(c.getSpecificActivities())
                .description(c.getDescription())
                .incorporationDate(c.getIncorporationDate())
                .contactName(c.getContactName())
                .contactDesignation(c.getContactDesignation())
                .employeeCount(c.getEmployeeCount())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .licenseNo(c.getLicenseNo())
                .licenseExpiry(c.getLicenseExpiry())
                .issuingAuthority(c.getIssuingAuthority())
                .licenseFileName(c.getLicenseFileName())
                .licenseFileSize(c.getLicenseFileSize())
                .licenseFileData(c.getLicenseFileData())
                .vatNo(c.getVatNo())
                .sstNo(c.getSstNo())
                .vatFileName(c.getVatFileName())
                .vatFileSize(c.getVatFileSize())
                .vatFileData(c.getVatFileData())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
