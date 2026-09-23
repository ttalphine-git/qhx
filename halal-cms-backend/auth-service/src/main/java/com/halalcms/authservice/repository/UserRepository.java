package com.halalcms.authservice.repository;

import com.halalcms.authservice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(User.UserRole role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE :q OR LOWER(u.fullName) LIKE :q")
    Page<User> findBySearch(@Param("q") String q, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.email) LIKE :q OR LOWER(u.fullName) LIKE :q)")
    Page<User> findByRoleAndSearch(@Param("role") User.UserRole role, @Param("q") String q, Pageable pageable);
}
