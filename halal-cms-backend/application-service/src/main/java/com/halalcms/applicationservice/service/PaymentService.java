package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.ApplicationPaymentStatusDto;
import com.halalcms.applicationservice.model.PaymentInfo;
import com.halalcms.applicationservice.repository.PaymentInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentInfoRepository paymentInfoRepository;

    public ApplicationPaymentStatusDto getPaymentStatus(Long applicationId) {
        return paymentInfoRepository.findByApplicationId(applicationId)
                .map(p -> ApplicationPaymentStatusDto.builder()
                        .applicationId(p.getApplicationId())
                        .paymentRequired(Boolean.TRUE.equals(p.getPaymentRequired()))
                        .paymentStatus(p.getPaymentStatus())
                        .amount(p.getAmount())
                        .currency(p.getCurrency())
                        .reference(p.getReference())
                        .build())
                .orElse(ApplicationPaymentStatusDto.builder()
                        .applicationId(applicationId)
                        .paymentRequired(false)
                        .paymentStatus("PENDING")
                        .currency("MYR")
                        .build());
    }
}
