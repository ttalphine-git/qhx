package com.halalcms.companyservice.dto;

import com.halalcms.companyservice.model.Factory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FactoryRequest {
    @NotBlank private String name;
    @NotNull  private Factory.FactoryType factoryType;
    @NotBlank private String address;
    private String city;
    private String state;
    private String postcode;
    private String country;
    private String phone;
    private String pic;
    private String picPhone;
    private String notes;
}
