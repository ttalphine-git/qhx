package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.DatabaseColumnDto;
import com.halalcms.applicationservice.dto.DatabaseRowsDto;
import com.halalcms.applicationservice.dto.DatabaseTableDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.temporal.TemporalAccessor;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseIntrospectionService {

    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    private static final List<String> DATABASES = List.of(
            "halalcms_auth",
            "halalcms_companies",
            "halalcms_applications",
            "halalcms_certificates",
            "halalcms_inspections",
            "halalcms_notifications"
    );

    @Transactional(readOnly = true)
    public List<DatabaseTableDto> listTables() {
        return DATABASES.stream()
                .flatMap(database -> listTables(database).stream())
                .toList();
    }

    private List<DatabaseTableDto> listTables(String database) {
        String sql = """
                SELECT
                    t.table_schema,
                    t.table_name,
                    t.table_type,
                    COALESCE(s.n_live_tup, 0) AS estimated_rows
                FROM information_schema.tables t
                LEFT JOIN pg_catalog.pg_stat_user_tables s
                    ON s.schemaname = t.table_schema
                   AND s.relname = t.table_name
                WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
                  AND t.table_type = 'BASE TABLE'
                ORDER BY t.table_schema, t.table_name
                """;
        try {
            JdbcTemplate db = jdbc(database);
            return db.query(sql, (rs, rowNum) -> {
                String schema = rs.getString("table_schema");
                String table = rs.getString("table_name");
                return DatabaseTableDto.builder()
                        .database(database)
                        .schema(schema)
                        .name(table)
                        .type(rs.getString("table_type"))
                        .estimatedRows(rs.getLong("estimated_rows"))
                        .columns(listColumns(db, schema, table))
                        .build();
            });
        } catch (DataAccessException ex) {
            log.warn("Skipping database metadata for {}: {}", database, ex.getMostSpecificCause().getMessage());
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public DatabaseRowsDto listRows(String database, String schema, String table, int page, int size) {
        String safeDatabase = requireDatabase(database);
        String safeSchema = requireIdentifier(schema, "schema");
        String safeTable = requireIdentifier(table, "table");
        JdbcTemplate db = jdbc(safeDatabase);
        if (!tableExists(db, safeSchema, safeTable)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Database table not found");
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        int offset = safePage * safeSize;
        String tableRef = quoteIdentifier(safeSchema) + "." + quoteIdentifier(safeTable);
        Long total = db.queryForObject("SELECT COUNT(*) FROM " + tableRef, Long.class);
        List<DatabaseColumnDto> columnDtos = listColumns(db, safeSchema, safeTable);
        List<String> columns = columnDtos.stream().map(DatabaseColumnDto::getName).toList();
        List<Map<String, Object>> rows = db.query(
                "SELECT * FROM " + tableRef + " LIMIT ? OFFSET ?",
                (rs, rowNum) -> toRow(rs, columns),
                safeSize,
                offset
        );

        return DatabaseRowsDto.builder()
                .database(safeDatabase)
                .schema(safeSchema)
                .table(safeTable)
                .page(safePage)
                .size(safeSize)
                .totalRows(total == null ? 0L : total)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private List<DatabaseColumnDto> listColumns(JdbcTemplate db, String schema, String table) {
        Set<String> primaryKeys = primaryKeys(db, schema, table);
        String sql = """
                SELECT column_name, data_type, is_nullable, column_default, ordinal_position
                FROM information_schema.columns
                WHERE table_schema = ?
                  AND table_name = ?
                ORDER BY ordinal_position
                """;
        return db.query(sql, (rs, rowNum) -> toColumn(rs, primaryKeys), schema, table);
    }

    private Set<String> primaryKeys(JdbcTemplate db, String schema, String table) {
        String sql = """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                 AND tc.table_name = kcu.table_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_schema = ?
                  AND tc.table_name = ?
                """;
        return new HashSet<>(db.queryForList(sql, String.class, schema, table));
    }

    private boolean tableExists(JdbcTemplate db, String schema, String table) {
        String sql = """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = ?
                  AND table_name = ?
                  AND table_type = 'BASE TABLE'
                  AND table_schema NOT IN ('pg_catalog', 'information_schema')
                """;
        Integer count = db.queryForObject(sql, Integer.class, schema, table);
        return count != null && count > 0;
    }

    private String requireDatabase(String database) {
        String value = database == null || database.isBlank() ? "halalcms_applications" : database;
        if (!DATABASES.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid database");
        }
        return value;
    }

    private JdbcTemplate jdbc(String database) {
        String url = datasourceUrl.replaceFirst("/[^/?]+(?=\\?|$)", "/" + database);
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(url);
        dataSource.setUsername(datasourceUsername);
        dataSource.setPassword(datasourcePassword);
        return new JdbcTemplate(dataSource);
    }

    private String requireIdentifier(String value, String label) {
        if (value == null || !value.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + label + " identifier");
        }
        return value;
    }

    private String quoteIdentifier(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private Map<String, Object> toRow(ResultSet rs, List<String> columns) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        for (String column : columns) {
            Object value = rs.getObject(column);
            if (value instanceof Timestamp timestamp) {
                value = timestamp.toInstant().toString();
            } else if (value instanceof TemporalAccessor) {
                value = value.toString();
            }
            row.put(column, value);
        }
        return row;
    }

    private DatabaseColumnDto toColumn(ResultSet rs, Set<String> primaryKeys) throws SQLException {
        String name = rs.getString("column_name");
        return DatabaseColumnDto.builder()
                .name(name)
                .type(rs.getString("data_type"))
                .nullable("YES".equalsIgnoreCase(rs.getString("is_nullable")))
                .defaultValue(rs.getString("column_default"))
                .primaryKey(primaryKeys.contains(name))
                .ordinalPosition(rs.getInt("ordinal_position"))
                .build();
    }
}
