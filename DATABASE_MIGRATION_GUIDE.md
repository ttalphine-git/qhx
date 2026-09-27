# Database Migration - Hibernate-Based (No Flyway)

**Status**: ✅ **FULLY CONFIGURED**

---

## 📊 How Database Migration Works Now

Instead of Flyway SQL migration scripts, the system now uses **Hibernate JPA Entity Definitions** for schema management.

### Migration Flow:

```
1. Application Startup
   ↓
2. PostgreSQL Connection
   ↓
3. Database Initialization Script (init-multiple-dbs.sh)
   ├─ Creates all 6 databases
   ├─ Sets user permissions
   └─ Adds UUID extensions
   ↓
4. Hibernate Scans Entity Classes (@Entity)
   ↓
5. Compares Database Schema vs Entity Definitions
   ↓
6. Auto-Creates/Updates Tables (ddl-auto: update)
   ├─ Creates missing tables
   ├─ Adds missing columns
   ├─ Creates indexes
   ├─ Establishes relationships
   └─ ⚠️ Does NOT drop columns/tables
   ↓
7. Application Ready
```

---

## 🔧 Configuration

### Hibernate DDL Auto Setting

All services configured with:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

**What `update` does:**
- ✅ Creates missing tables
- ✅ Adds missing columns
- ✅ Creates missing indexes
- ✅ Keeps existing data
- ❌ Does NOT drop columns
- ❌ Does NOT drop tables

---

## 📦 Database Initialization

### Automated Database Creation

**File**: `halal-cms-backend/infra/postgres/init-multiple-dbs.sh`

```bash
#!/bin/bash
# Creates 6 databases automatically on PostgreSQL startup

halalcms_auth              (Auth Service)
halalcms_applications      (Application Service)
halalcms_companies         (Company Service)
halalcms_certificates      (Certificate Service)
halalcms_inspections       (Inspection Service)
halalcms_notifications     (Notification Service)
```

**When it runs:**
- ✅ Docker Compose startup (via `/docker-entrypoint-initdb.d/`)
- ✅ Runs automatically before services start
- ✅ Idempotent (safe to run multiple times)
- ✅ Creates missing databases only

---

## 🎯 Schema Definition

### Entity Classes Define Schema

Schema is now defined through JPA entity annotations, not SQL files.

**Entity Count Per Service:**
```
auth-service:         1 entity    → 1 table
application-service:  7 entities  → 7 tables
certificate-service:  5 entities  → 5 tables
company-service:      3 entities  → 3 tables
inspection-service:   16 entities → 16 tables
─────────────────────────────────────────────
TOTAL:               32 entities → 32 tables
```

### Example Entity (User)

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private String role;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

**Translates to SQL:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 Migration Process for Each Service

### Service Startup Sequence

1. **Docker Compose Starts PostgreSQL**
   - Image: postgres:16-alpine
   - Runs init-multiple-dbs.sh
   - Creates all 6 databases

2. **Service Starts (Auth Service Example)**
   ```bash
   docker-compose up -d auth-service
   ```

3. **Hibernate Initialization**
   - Reads: `application.yml`
   - Reads: `ddl-auto: update`
   - Scans classpath for @Entity classes
   - Connects to `halalcms_auth` database

4. **Schema Validation/Creation**
   - Compares entity definitions vs database schema
   - Creates missing tables automatically
   - Adds missing columns automatically
   - Creates indexes from @Index annotations
   - Establishes foreign keys from @ManyToOne, @OneToMany

5. **Application Ready**
   - All tables exist
   - Indexes created
   - Ready to accept requests

---

## 🛠️ Adding New Tables

### How to Add a New Table

1. **Create Entity Class**
   ```java
   @Entity
   @Table(name = "audit_logs")
   public class AuditLog {
       @Id
       @GeneratedValue(strategy = GenerationType.UUID)
       private UUID id;
       
       @Column(nullable = false)
       private String action;
       
       @Column(nullable = false)
       private LocalDateTime timestamp;
   }
   ```

2. **Place in Service**
   ```
   application-service/src/main/java/.../model/AuditLog.java
   ```

3. **Restart Service**
   ```bash
   docker-compose restart application-service
   ```

4. **Table Created Automatically**
   ```sql
   -- Hibernate automatically creates this table
   CREATE TABLE audit_logs (
       id UUID PRIMARY KEY,
       action VARCHAR(255) NOT NULL,
       timestamp TIMESTAMP NOT NULL
   );
   ```

**No SQL scripts needed!** ✅

---

## 🔄 Modifying Existing Tables

### Adding a Column

1. **Update Entity**
   ```java
   @Entity
   @Table(name = "users")
   public class User {
       // ... existing fields ...
       
       @Column(name = "last_login")  // NEW COLUMN
       private LocalDateTime lastLogin;
   }
   ```

2. **Restart Service**
   ```bash
   docker-compose restart auth-service
   ```

3. **Column Added Automatically**
   ```sql
   ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
   ```

---

## ⚠️ Important: Data Safety

### What Happens with ddl-auto: update

✅ **Safe Operations:**
- Creates missing tables
- Adds missing columns
- Creates new indexes
- Adds foreign keys
- Keeps existing data

❌ **NOT Supported:**
- Dropping columns
- Dropping tables
- Renaming columns
- Changing column types

### If You Need to Remove a Column:

**Option 1: Manual SQL**
```bash
docker-compose exec postgres psql -U halal_user -d halalcms_auth
# Then run manual SQL
ALTER TABLE users DROP COLUMN old_column;
```

**Option 2: Backup & Recreate**
```bash
# Backup data
docker-compose exec postgres pg_dump -U halal_user halalcms_auth > backup.sql

# Change ddl-auto to 'create' (recreates schema)
# Restart service
# Change ddl-auto back to 'update'
```

---

## 📊 Current Database Schema

### Auth Service (1 table)
```
users                    (User entity)
├─ id: UUID
├─ email: String
├─ password_hash: String
├─ role: String
├─ full_name: String
├─ company_id: UUID
├─ enabled: Boolean
├─ email_verified: Boolean
├─ created_at: LocalDateTime
└─ updated_at: LocalDateTime
```

### Application Service (7 tables)
```
applications             (Application entity)
event_logs              (EventLog entity)
documents               (Document entity)
payment_info            (PaymentInfo entity)
hcb_accreditation_scopes
non_conformities
observations
```

### Certificate Service (5 tables)
```
certificates
batch_certificate_requests
batch_certificate_documents
batch_certificate_settings
batch_certificate_templates
```

### Company Service (3 tables)
```
companies
factories
products
```

### Inspection Service (16 tables)
```
audit_statuses
audit_plans
non_conformities
recommendations
audit_event_logs
audit_report_configurations
audit_summary_and_decisions
notifications_and_logging
(and more...)
```

---

## 🚀 Deployment Behavior

### Development (Local)
```bash
cd halal-cms-backend
docker-compose up -d

# What happens:
# 1. PostgreSQL starts
# 2. init-multiple-dbs.sh creates 6 databases
# 3. Each service starts
# 4. Hibernate creates all tables from entities
# 5. All ready in ~30 seconds
```

### Production (DigitalOcean)
```bash
cd support
docker-compose -f docker-compose.prod.yml up -d

# What happens:
# 1. PostgreSQL starts
# 2. init-multiple-dbs.sh creates 6 databases
# 3. Each service pulls image from registry
# 4. Services start
# 5. Hibernate creates/updates tables
# 6. All ready in ~60 seconds
```

---

## ✅ Verification

### Check if Tables Exist

```bash
# Connect to database
docker-compose exec postgres psql -U halal_user -d halalcms_auth

# List tables
\dt

# Check specific table
\d+ users

# Exit
\q
```

### Check Hibernate Logs

```bash
# View service logs
docker-compose logs auth-service | grep -i hibernate

# Should show:
# - HHH000412: Hibernate ORM core version
# - HHH000400: Using dialect: PostgreSQL...
# - CREATE TABLE statements (if new)
```

### Verify All Services Started

```bash
# Check all services
docker-compose ps

# Should show all services as "Up"
# Test endpoints
curl http://localhost:8081/actuator/health
```

---

## 🔄 Version Control

### Schema Changes Are Code Changes

Since schema is defined in Java entities:

1. **Schema changes** = Entity class changes
2. **Tracked in git** = In your source control
3. **Reviewed in PRs** = Like any code change
4. **No separate migration scripts** = Everything is code

**Example PR:**
```
Commit: Add audit_logs table

- Added AuditLog entity
- Maps to audit_logs table
- Auto-created on service restart
```

---

## 🛡️ Safety Practices

### Before Deploying Schema Changes

1. **Test Locally**
   ```bash
   cd halal-cms-backend
   docker-compose up -d
   # Test schema changes work
   ```

2. **Backup Production Database**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres \
     pg_dump -U halal_user halalcms_auth > backup-$(date +%Y%m%d).sql
   ```

3. **Deploy Service**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d auth-service
   ```

4. **Verify**
   ```bash
   curl http://localhost:8081/actuator/health
   ```

---

## 📝 Configuration by Environment

### Development
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update        # Auto-create/update
    show-sql: false
```

### Production
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update        # Still update (safe)
    show-sql: false
```

### Alternative (Validate Only)
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate      # Only validate, no changes
```

**Recommended for Production:** Keep as `update` (safer than `validate`)

---

## ✨ Summary

| Aspect | Before (Flyway) | Now (Hibernate) |
|--------|-----------------|-----------------|
| **Migration Files** | SQL scripts in `/db/migration/` | Java entities (no SQL scripts) |
| **Schema Definition** | SQL files | `@Entity` classes |
| **Auto-Creation** | Flyway applies migrations | Hibernate compares & creates |
| **Version Control** | SQL files in git | Entity classes in git |
| **New Tables** | Write SQL migration | Create @Entity class |
| **Database Changes** | Run SQL scripts | Restart service |
| **Data Safety** | Manual careful SQL | Hibernate prevents drops |

---

## 🚀 Ready for Deployment

✅ Database migration fully configured  
✅ 32 entities defining schema  
✅ Automatic table creation enabled  
✅ All services ready to start  
✅ No SQL migration files needed  

**System is production-ready!** 🎉

---

**Created**: 2026-09-27  
**Status**: ✅ Complete
