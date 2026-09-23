package com.halalcms.applicationservice.repository;

import com.halalcms.applicationservice.model.PaymentInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentInfoRepository extends JpaRepository<PaymentInfo, Long> {

    Optional<PaymentInfo> findByApplicationId(Long applicationId);
}
