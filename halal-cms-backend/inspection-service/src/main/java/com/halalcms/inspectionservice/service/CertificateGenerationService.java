package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.CertificateWorkflow;
import com.halalcms.inspectionservice.repository.CertificateWorkflowRepository;
import com.halalcms.inspectionservice.util.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CertificateGenerationService {

    private final CertificateWorkflowRepository certificateRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WorkflowLogService workflowLogService;
    private final QRCodeGenerator qrCodeGenerator;

    public CertificateWorkflow generateCertificate(Long auditId, Long applicationId) {
        log.info("Generating certificate for audit {}", auditId);

        String certificateNumber = generateCertificateNumber();
        LocalDate validFrom = LocalDate.now();
        LocalDate validTo = validFrom.plusYears(1);

        CertificateWorkflow certificate = CertificateWorkflow.builder()
            .auditId(auditId)
            .applicationId(applicationId)
            .certificateNumber(certificateNumber)
            .status("GENERATED")
            .generatedAt(LocalDateTime.now())
            .validFrom(validFrom)
            .validTo(validTo)
            .build();

        try {
            String qrCode = qrCodeGenerator.generateQRCode(certificateNumber, "https://halalcms.com/verify", 200, 200);
            certificate.setQrCodeData(qrCode);
            log.info("QR code generated for certificate: {}", certificateNumber);
        } catch (Exception e) {
            log.warn("Failed to generate QR code for certificate: {}", certificateNumber, e);
        }

        CertificateWorkflow saved = certificateRepository.save(certificate);
        log.info("Certificate generated - Cert ID: {}, Number: {}", saved.getId(), certificateNumber);

        notificationService.notifyAdmin("CERTIFICATE_GENERATED",
            "Certificate generated for audit #" + auditId,
            "/audits/" + auditId + "/certificate");

        emailService.sendEmail("admin@hcb.com", "Certificate Ready for Review",
            "CERTIFICATE_GENERATED", auditId, applicationId);

        workflowLogService.logAction(applicationId, "CERTIFICATE", saved.getId(), "GENERATED",
            "Certificate generated with number: " + certificateNumber, null, "PENDING", "GENERATED");

        return saved;
    }

    public CertificateWorkflow approveCertificate(Long certificateId, String approvalNotes, Long approvedBy) {
        log.info("Approving certificate {}", certificateId);

        Optional<CertificateWorkflow> certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) {
            throw new RuntimeException("Certificate not found: " + certificateId);
        }

        CertificateWorkflow certificate = certOpt.get();
        certificate.setStatus("APPROVED");
        certificate.setApprovedBy(approvedBy != null ? String.valueOf(approvedBy) : "ADMIN");
        certificate.setApprovedAt(LocalDateTime.now());

        CertificateWorkflow updated = certificateRepository.save(certificate);
        log.info("Certificate approved - Cert ID: {}", certificateId);

        notificationService.notifyAdmin("CERTIFICATE_APPROVED",
            "Certificate approved and ready to send",
            "/audits/certificates/" + certificateId);

        workflowLogService.logCertificateApproved(certificateId, approvedBy);

        return updated;
    }

    public CertificateWorkflow sendCertificate(Long certificateId, String customerEmail, Long applicationId) {
        log.info("Sending certificate {} to {}", certificateId, customerEmail);

        Optional<CertificateWorkflow> certOpt = certificateRepository.findById(certificateId);
        if (certOpt.isEmpty()) {
            throw new RuntimeException("Certificate not found: " + certificateId);
        }

        CertificateWorkflow certificate = certOpt.get();
        certificate.setStatus("SENT");
        certificate.setSentToCustomerAt(LocalDateTime.now());

        CertificateWorkflow updated = certificateRepository.save(certificate);
        log.info("Certificate sent - Cert ID: {}, Email: {}", certificateId, customerEmail);

        emailService.sendCertificateSentEmail(customerEmail, certificateId, certificate.getCertificateNumber());

        workflowLogService.logCertificateSent(certificateId, customerEmail);

        notificationService.notifyCustomer(applicationId, "CERTIFICATE_SENT",
            "Your Halal Certificate has been issued!",
            "/certificates/" + certificateId);

        return updated;
    }

    public CertificateWorkflow getCertificate(Long certificateId) {
        return certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificate not found: " + certificateId));
    }

    public CertificateWorkflow getCertificateByNumber(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber)
            .orElseThrow(() -> new RuntimeException("Certificate not found: " + certificateNumber));
    }

    private String generateCertificateNumber() {
        // Format: HCB-YYYY-XXXXX
        return "HCB-" + LocalDate.now().getYear() + "-" + String.format("%05d", System.nanoTime() % 100000);
    }
}
