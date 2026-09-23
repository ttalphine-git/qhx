package com.halalcms.inspectionservice.repository;

import com.halalcms.inspectionservice.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(String userId);

    List<Notification> findByRelatedAuditId(Long auditId);

    List<Notification> findByRelatedApplicationId(Long applicationId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id")
    void markAsRead(@Param("id") Long id, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsReadForUser(@Param("userId") String userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.userId = :userId")
    void deleteAllByUserId(@Param("userId") String userId);
}
