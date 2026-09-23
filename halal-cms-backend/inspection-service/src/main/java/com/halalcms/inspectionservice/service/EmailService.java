package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.EmailSent;
import com.halalcms.inspectionservice.repository.EmailSentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final EmailSentRepository emailSentRepository;

    @Value("${spring.mail.username:noreply@halalcertificationboard.com}")
    private String fromEmail;

    @Value("${app.email.signature:Halal Certification Board}")
    private String emailSignature;

    public void sendEmail(String recipientEmail, String subject, String emailType, Long entityId) {
        sendEmail(recipientEmail, subject, buildEmailBody(emailType, entityId), emailType, entityId, null);
    }

    public void sendEmail(String recipientEmail, String subject, String htmlContent, String emailType, Long entityId, Long relatedApplicationId) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            javaMailSender.send(message);

            // Log email sent
            EmailSent emailLog = EmailSent.builder()
                .recipientEmail(recipientEmail)
                .subject(subject)
                .bodyText(htmlContent)
                .emailType(emailType)
                .relatedApplicationId(relatedApplicationId != null ? relatedApplicationId : entityId)
                .deliveryStatus("SENT")
                .sentAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

            emailSentRepository.save(emailLog);
            log.info("Email sent successfully - To: {}, Type: {}, Entity: {}", recipientEmail, emailType, entityId);

        } catch (MessagingException e) {
            log.error("Failed to send email to {} - Type: {} - Error: {}", recipientEmail, emailType, e.getMessage(), e);

            // Log failed delivery attempt
            EmailSent emailLog = EmailSent.builder()
                .recipientEmail(recipientEmail)
                .subject(subject)
                .bodyText(htmlContent)
                .emailType(emailType)
                .deliveryStatus("FAILED")
                .deliveryError(e.getMessage())
                .sentAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

            emailSentRepository.save(emailLog);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    public void sendBulkEmail(String[] recipients, String subject, String emailType, Long entityId) {
        log.info("Sending bulk email to {} recipients - Type: {}", recipients.length, emailType);

        for (String recipient : recipients) {
            try {
                sendEmail(recipient, subject, emailType, entityId);
            } catch (Exception e) {
                log.error("Failed to send bulk email to {}", recipient, e);
            }
        }
    }

    public void sendNCApprovedEmail(String customerEmail, Long ncId, String ncCategory) {
        String htmlBody = "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Non-Conformity Approved</h2>" +
            "<p>Your non-conformity submission for category <strong>" + ncCategory + "</strong> has been reviewed and approved.</p>" +
            "<p><strong>Next Steps:</strong> Your application will proceed to the next stage of certification.</p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";

        sendEmail(customerEmail, "Non-Conformity Approved", htmlBody, "NC_APPROVED", ncId, null);
    }

    public void sendNCRejectedEmail(String customerEmail, Long ncId, String feedback) {
        String htmlBody = "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Non-Conformity Requires Resubmission</h2>" +
            "<p>Your non-conformity submission requires additional information or corrections.</p>" +
            "<p><strong>Feedback:</strong></p><p>" + (feedback != null ? feedback : "Please review and resubmit") + "</p>" +
            "<p><strong>Action Required:</strong> Please address the feedback and resubmit your response.</p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";

        sendEmail(customerEmail, "Non-Conformity Requires Resubmission", htmlBody, "NC_REJECTED", ncId, null);
    }

    public void sendDecisionAssignmentEmail(String decisionMakerEmail, Long auditId, String decisionType) {
        String htmlBody = "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Decision Request Assignment</h2>" +
            "<p>You have been assigned a decision request for audit #" + auditId + ".</p>" +
            "<p><strong>Decision Type:</strong> " + decisionType + "</p>" +
            "<p><strong>Action Required:</strong> Please log in to the system to review and make your decision.</p>" +
            "<p><a href=\"#\">Review Decision Request</a></p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";

        sendEmail(decisionMakerEmail, "Decision Request: " + decisionType, htmlBody, "DECISION_REQUEST_ASSIGNED", auditId, null);
    }

    public void sendCertificateApprovedEmail(String customerEmail, Long certificateId) {
        String htmlBody = "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Halal Certificate Approved</h2>" +
            "<p>Congratulations! Your halal certificate has been approved and is ready for issuance.</p>" +
            "<p><strong>Next Steps:</strong> Your certificate will be sent to you shortly.</p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";

        sendEmail(customerEmail, "Halal Certificate Approved", htmlBody, "CERTIFICATE_APPROVED", certificateId, null);
    }

    public void sendCertificateSentEmail(String customerEmail, Long certificateId, String certificateNumber) {
        String htmlBody = "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Your Halal Certificate is Ready</h2>" +
            "<p>Your halal certificate has been issued successfully.</p>" +
            "<p><strong>Certificate Number:</strong> " + certificateNumber + "</p>" +
            "<p>You can download your certificate from the portal or access it through your account.</p>" +
            "<p><a href=\"#\">Download Certificate</a></p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";

        sendEmail(customerEmail, "Your Halal Certificate is Ready", htmlBody, "CERTIFICATE_SENT", certificateId, null);
    }

    private String buildEmailBody(String emailType, Long entityId) {
        return "<html><body style=\"font-family: Arial, sans-serif;\">" +
            "<h2>Halal Certification Update</h2>" +
            "<p>Event Type: " + emailType + "</p>" +
            "<p>Entity ID: " + entityId + "</p>" +
            "<hr/><p>" + emailSignature + "</p></body></html>";
    }
}
