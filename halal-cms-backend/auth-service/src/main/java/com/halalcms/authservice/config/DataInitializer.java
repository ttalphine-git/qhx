package com.halalcms.authservice.config;

// Deployment trigger: docker-compose and service.sh are now available for deployment
import com.halalcms.authservice.model.User;
import com.halalcms.authservice.repository.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Value("${app.init.admin-password:admin123}")
    private String adminPassword;

    @Value("${app.init.super-admin-password:sqxad@12098}")
    private String superAdminPassword;

    @Value("${app.init.test-customer-password:test123}")
    private String testCustomerPassword;

    @Override
    public void run(ApplicationArguments args) {
        // Ensure admin@halalcms.com exists and is enabled
        userRepository.findByEmail("admin@halalcms.com").ifPresentOrElse(admin -> {
            if (!admin.isEnabled()) {
                admin.setEnabled(true);
                userRepository.save(admin);
                log.info("Re-enabled admin user: admin@halalcms.com");
            }
        }, () -> {
            User admin = User.builder()
                    .email("admin@halalcms.com")
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .fullName("System Admin")
                    .role(User.UserRole.OFFICE_ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded admin user: admin@halalcms.com");
        });

        // Seed super admin — always ensure it exists and is enabled
        userRepository.findByEmail("qhxadinsuper").ifPresentOrElse(sa -> {
            boolean changed = false;
            if (!passwordEncoder.matches(superAdminPassword, sa.getPasswordHash())) {
                sa.setPasswordHash(passwordEncoder.encode(superAdminPassword));
                changed = true;
            }
            if (!sa.isEnabled()) {
                sa.setEnabled(true);
                changed = true;
            }
            if (sa.getRole() != User.UserRole.SUPER_ADMIN) {
                sa.setRole(User.UserRole.SUPER_ADMIN);
                changed = true;
            }
            if (changed) {
                userRepository.save(sa);
                log.info("Updated super admin: qhxadinsuper");
            }
        }, () -> {
            User superAdmin = User.builder()
                    .email("qhxadinsuper")
                    .passwordHash(passwordEncoder.encode(superAdminPassword))
                    .fullName("QHX Super Admin")
                    .role(User.UserRole.SUPER_ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(superAdmin);
            log.info("Seeded super admin: qhxadinsuper");
        });

        // Seed test customer for testing
        userRepository.findByEmail("test@factory.com").ifPresentOrElse(customer -> {
            boolean changed = false;
            if (!customer.isEnabled()) {
                customer.setEnabled(true);
                changed = true;
            }
            if (customer.getRole() != User.UserRole.CUSTOMER) {
                customer.setRole(User.UserRole.CUSTOMER);
                changed = true;
            }
            if (changed) {
                userRepository.save(customer);
                log.info("Updated test customer: test@factory.com");
            }
        }, () -> {
            User testCustomer = User.builder()
                    .email("test@factory.com")
                    .passwordHash(passwordEncoder.encode(testCustomerPassword))
                    .fullName("Test Factory")
                    .role(User.UserRole.CUSTOMER)
                    .enabled(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(testCustomer);
            log.info("Seeded test customer: test@factory.com with password: " + testCustomerPassword);
        });

        // Seed additional super admin
        userRepository.findByEmail("superadmin@halalcms.com").ifPresentOrElse(sa -> {
            if (!sa.isEnabled()) {
                sa.setEnabled(true);
                userRepository.save(sa);
                log.info("Re-enabled super admin: superadmin@halalcms.com");
            }
        }, () -> {
            User superAdmin2 = User.builder()
                    .email("superadmin@halalcms.com")
                    .passwordHash(passwordEncoder.encode(superAdminPassword))
                    .fullName("QHX Super Admin 2")
                    .role(User.UserRole.SUPER_ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(superAdmin2);
            log.info("Seeded super admin: superadmin@halalcms.com");
        });

       // ensureAllUsersEnabled();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void ensureAllUsersEnabled() {
        int updated = entityManager.createQuery("UPDATE User u SET u.enabled = true WHERE u.enabled = false")
                .executeUpdate();
        if (updated > 0) {
            log.info("Enabled {} disabled users", updated);
        }
    }
}
