package com.halalcms.certificateservice.service;

import com.halalcms.certificateservice.model.BatchCertificateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchCertificateNotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@halal-cms.com}")
    private String fromEmail;

    @Value("${halal-cms.app-url:https://halal-cms.example.com}")
    private String appUrl;

    @Async
    public void sendApprovalNotification(BatchCertificateRequest request) {
        try {
            String to = request.getProducerEmail();
            if (to == null || to.trim().isEmpty()) {
                log.warn("No email address for batch request {}", request.getRequestNumber());
                return;
            }

            String subject = String.format("Batch Certificate Approved - %s", request.getCertificateNumber());
            String body = buildApprovalEmailBody(request);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Approval notification sent to {} for request {}", to, request.getRequestNumber());
        } catch (Exception e) {
            log.error("Failed to send approval notification for request {}", request.getRequestNumber(), e);
        }
    }

    @Async
    public void sendRejectionNotification(BatchCertificateRequest request) {
        try {
            String to = request.getProducerEmail();
            if (to == null || to.trim().isEmpty()) {
                log.warn("No email address for batch request {}", request.getRequestNumber());
                return;
            }

            String subject = String.format("Batch Certificate Request Rejected - %s", request.getRequestNumber());
            String body = buildRejectionEmailBody(request);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Rejection notification sent to {} for request {}", to, request.getRequestNumber());
        } catch (Exception e) {
            log.error("Failed to send rejection notification for request {}", request.getRequestNumber(), e);
        }
    }

    private String buildApprovalEmailBody(BatchCertificateRequest request) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(request.getProducerName()).append(",\n\n");
        body.append("Your batch certificate request has been APPROVED!\n\n");

        body.append("=== Certificate Details ===\n");
        body.append("Certificate Number: ").append(request.getCertificateNumber()).append("\n");
        body.append("Request Number: ").append(request.getRequestNumber()).append("\n");
        body.append("Producer: ").append(request.getProducerName()).append("\n");
        body.append("Shipment Date: ").append(request.getShipmentDate()).append("\n");
        body.append("Total Weight: ").append(request.getTotalWeightKg()).append(" kg\n");
        body.append("Total Fee: ").append(request.getCurrency()).append(" ").append(request.getTotalFee()).append("\n");
        body.append("Approved At: ").append(request.getApprovedAt().format(fmt)).append("\n");

        if (request.getAdminNotes() != null && !request.getAdminNotes().trim().isEmpty()) {
            body.append("\nAdmin Notes:\n").append(request.getAdminNotes()).append("\n");
        }

        body.append("\n=== Next Steps ===\n");
        body.append("1. Download your certificate from the customer portal\n");
        body.append("2. Share the certificate with your customers/partners\n");
        body.append("3. Use the QR code for quick verification\n");
        body.append("4. Certificate available at: ").append(appUrl).append("/customer/batch-certificates/").append(request.getId()).append("\n");

        body.append("\n=== Verification ===\n");
        body.append("Public Verification: ").append(appUrl).append("/verify/").append(request.getCertificateNumber()).append("\n");

        body.append("\nIf you have any questions, please contact our office.\n\n");
        body.append("Best regards,\n");
        body.append("HalalCMS Team\n");

        return body.toString();
    }

    private String buildRejectionEmailBody(BatchCertificateRequest request) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm");

        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(request.getProducerName()).append(",\n\n");
        body.append("Your batch certificate request has been REJECTED.\n\n");

        body.append("=== Request Details ===\n");
        body.append("Request Number: ").append(request.getRequestNumber()).append("\n");
        body.append("Producer: ").append(request.getProducerName()).append("\n");
        body.append("Shipment Date: ").append(request.getShipmentDate()).append("\n");
        body.append("Total Weight: ").append(request.getTotalWeightKg()).append(" kg\n");
        body.append("Rejected At: ").append(request.getRejectedAt().format(fmt)).append("\n");

        body.append("\n=== Reason for Rejection ===\n");
        body.append(request.getRejectionReason()).append("\n");

        body.append("\n=== Next Steps ===\n");
        body.append("Please review the rejection reason above.\n");
        body.append("You may submit a new request after addressing the issues.\n");
        body.append("For assistance, contact our office.\n");

        body.append("\nRequest Details: ").append(appUrl).append("/customer/batch-certificates/").append(request.getId()).append("\n");

        body.append("\nBest regards,\n");
        body.append("HalalCMS Team\n");

        return body.toString();
    }
}
