package com.halalcms.applicationservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceClient {

    private final RestTemplate restTemplate;

    public CompanyDto getCompany(String companyId) {
        try {
            String url = "http://localhost:8083/companies/" + companyId;
            ResponseEntity<CompanyDto> response = restTemplate.getForEntity(url, CompanyDto.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.warn("Failed to fetch company from company-service: {}", e.getMessage());
            return null;
        }
    }

    public CompanyDto getCompanyByUserId(String userId) {
        try {
            String url = "http://localhost:8083/companies/user/" + userId;
            ResponseEntity<CompanyDto> response = restTemplate.getForEntity(url, CompanyDto.class);
            return response.getBody();
        } catch (RestClientException e) {
            log.warn("Failed to fetch company by userId from company-service: {}", e.getMessage());
            return null;
        }
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class CompanyDto {
        private String id;
        private String registrationNumber;
        private String name;
        private String businessType;
        private String address;
        private String city;
        private String country;
        private String phone;
        private String email;
        private String website;
        private String licenseNo;
        private String licenseExpiry;
        private String issuingAuthority;
        private String vatNo;
        private String sstNo;
        private String description;
        private String activityCategory;
        private String specificActivities;
    }
}
