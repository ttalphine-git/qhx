package com.halalcms.authservice.controller;

import com.halalcms.authservice.dto.UserListDto;
import com.halalcms.authservice.model.User;
import com.halalcms.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MgmtController {

    private final UserRepository userRepository;

    @GetMapping("/mgmt/users")
    public ResponseEntity<Page<UserListDto>> listUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    String filterByRole
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        User.UserRole role = null;
        if (filterByRole != null && !filterByRole.isBlank()) {
            try { role = User.UserRole.valueOf(filterByRole); } catch (IllegalArgumentException ignored) {}
        }
        Page<User> users = (search != null && !search.isBlank())
                ? (role != null
                    ? userRepository.findByRoleAndSearch(role, "%" + search.toLowerCase() + "%", pageable)
                    : userRepository.findBySearch("%" + search.toLowerCase() + "%", pageable))
                : (role != null
                    ? userRepository.findByRole(role, pageable)
                    : userRepository.findAll(pageable));

        return ResponseEntity.ok(users.map(UserListDto::from));
    }

    @PatchMapping("/users/{id}/profile")
    public ResponseEntity<UserListDto> updateProfile(
            @PathVariable String id,
            @RequestBody Map<String, Object> body
    ) {
        User user = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() == User.UserRole.SUPER_ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Super admin cannot be modified");
        }
        if (body.containsKey("fullName")       && body.get("fullName") != null)       user.setFullName((String) body.get("fullName"));
        if (body.containsKey("phone")          && body.get("phone") != null)          user.setPhone((String) body.get("phone"));
        if (body.containsKey("jobTitle")       && body.get("jobTitle") != null)       user.setJobTitle((String) body.get("jobTitle"));
        if (body.containsKey("department")     && body.get("department") != null)     user.setDepartment((String) body.get("department"));
        if (body.containsKey("employmentType") && body.get("employmentType") != null) user.setEmploymentType((String) body.get("employmentType"));
        if (body.containsKey("idProofNumber")  && body.get("idProofNumber") != null)  user.setIdProofNumber((String) body.get("idProofNumber"));
        if (body.containsKey("notes")          && body.get("notes") != null)          user.setNotes((String) body.get("notes"));
        if (body.containsKey("idDocName")      && body.get("idDocName") != null)      user.setIdDocName((String) body.get("idDocName"));
        if (body.containsKey("idDocData")      && body.get("idDocData") != null)      user.setIdDocData((String) body.get("idDocData"));
        if (body.containsKey("photoData")      && body.get("photoData") != null)      user.setPhotoData((String) body.get("photoData"));
        if (body.containsKey("role") && body.get("role") != null) {
            try {
                String roleStr = ((String) body.get("role")).toUpperCase();
                User.UserRole newRole = switch (roleStr) {
                    case "ADMIN", "OFFICE_ADMIN"         -> User.UserRole.OFFICE_ADMIN;
                    case "REVIEWER", "OFFICE_REVIEWER"   -> User.UserRole.OFFICE_REVIEWER;
                    case "AUDITOR"                       -> User.UserRole.AUDITOR;
                    case "SHARIA_AUDITOR"                -> User.UserRole.SHARIA_AUDITOR;
                    case "HALAL_REVIEWER"                -> User.UserRole.HALAL_REVIEWER;
                    case "DECISION_MAKER"                -> User.UserRole.DECISION_MAKER;
                    case "FINANCE"                       -> User.UserRole.FINANCE;
                    case "AUDIT_PLANNER"                 -> User.UserRole.AUDIT_PLANNER;
                    case "CERTIFICATE_CONTROLLER"        -> User.UserRole.CERTIFICATE_CONTROLLER;
                    case "QUALITY_MANAGER"               -> User.UserRole.QUALITY_MANAGER;
                    case "CUSTOMER"                      -> User.UserRole.CUSTOMER;
                    default                              -> User.UserRole.OFFICE_INSPECTOR;
                };
                user.setRole(newRole);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(UserListDto.from(userRepository.save(user)));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserListDto> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        User user = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() == User.UserRole.SUPER_ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Super admin cannot be modified");
        }
        String status = body.get("status");
        user.setEnabled("ACTIVE".equalsIgnoreCase(status));
        return ResponseEntity.ok(UserListDto.from(userRepository.save(user)));
    }
}
