package com.halalcms.inspectionservice.service;

import com.halalcms.inspectionservice.model.Notification;
import com.halalcms.inspectionservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notifyAuditor(Long auditorId, String eventType, String title, String actionUrl) {
        notifyUser(String.valueOf(auditorId), eventType, title, null, actionUrl);
        log.info("Notification sent to auditor: {} for event: {}", auditorId, eventType);
    }

    public void notifyCustomer(Long applicationId, String eventType, String title, String actionUrl) {
        Notification notification = Notification.builder()
            .userId("CUSTOMER")
            .notificationType(eventType)
            .title(title)
            .relatedApplicationId(applicationId)
            .actionUrl(actionUrl)
            .isRead(false)
            .createdAt(LocalDateTime.now())
            .build();

        notificationRepository.save(notification);
        log.info("Notification sent to customer for application: {} event: {}", applicationId, eventType);
    }

    public void notifyDecisionMaker(Long userId, String eventType, String title, String actionUrl) {
        notifyUser(String.valueOf(userId), eventType, title, null, actionUrl);
        log.info("Notification sent to decision maker: {} for event: {}", userId, eventType);
    }

    public void notifyAdmin(String eventType, String title, String actionUrl) {
        notifyUser("ADMIN", eventType, title, null, actionUrl);
        log.info("Notification sent to admin for event: {}", eventType);
    }

    public void notifyWithAudit(String userId, String eventType, String title, Long auditId, String actionUrl) {
        Notification notification = Notification.builder()
            .userId(userId)
            .notificationType(eventType)
            .title(title)
            .relatedAuditId(auditId)
            .actionUrl(actionUrl)
            .isRead(false)
            .createdAt(LocalDateTime.now())
            .build();

        notificationRepository.save(notification);
        log.info("Notification saved for user: {} audit: {} event: {}", userId, auditId, eventType);
    }

    private void notifyUser(String userId, String eventType, String title, String message, String actionUrl) {
        Notification notification = Notification.builder()
            .userId(userId)
            .notificationType(eventType)
            .title(title)
            .message(message)
            .actionUrl(actionUrl)
            .isRead(false)
            .createdAt(LocalDateTime.now())
            .build();

        notificationRepository.save(notification);
        log.debug("Notification persisted for user: {}", userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId, LocalDateTime.now());
        log.info("Notification marked as read: {}", notificationId);
    }

    public void markAllAsReadForUser(String userId) {
        notificationRepository.markAllAsReadForUser(userId, LocalDateTime.now());
        log.info("All notifications marked as read for user: {}", userId);
    }
}
