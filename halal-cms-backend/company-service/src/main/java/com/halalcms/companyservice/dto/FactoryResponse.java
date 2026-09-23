package com.halalcms.companyservice.dto;

import com.halalcms.companyservice.model.Factory;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class FactoryResponse {
    private UUID id;
    private UUID companyId;
    private String name;
    private Factory.FactoryType factoryType;
    private String address;
    private String city;
    private String state;
    private String postcode;
    private String country;
    private String phone;
    private String pic;
    private String picPhone;
    private String notes;
    private Factory.FactoryStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
