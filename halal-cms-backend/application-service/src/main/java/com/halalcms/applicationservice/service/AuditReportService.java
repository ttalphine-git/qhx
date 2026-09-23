package com.halalcms.applicationservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditReportService {

    @Value("${audit.files.storage-path:./uploads/audit-reports}")
    private String storagePath;

    @Value("${audit.files.max-file-size:52428800}") // 50MB default
    private long maxFileSize;

    private final ObjectMapper objectMapper;

    public Map<String, Object> saveAuditReport(Long applicationId, String payloadJson, Map<String, MultipartFile[]> fileGroups) throws Exception {
        log.info("Saving audit report for application: {}", applicationId);

        // Parse payload
        Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);

        // Create application audit directory
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String appAuditDir = String.format("%s/app_%d/%s", storagePath, applicationId, timestamp);
        Path auditDirPath = Paths.get(appAuditDir);
        Files.createDirectories(auditDirPath);

        Map<String, Object> fileMetadata = new HashMap<>();
        int totalFilesSaved = 0;

        // Process file groups
        for (Map.Entry<String, MultipartFile[]> entry : fileGroups.entrySet()) {
            String evidenceType = entry.getKey();
            MultipartFile[] files = entry.getValue();

            if (files != null && files.length > 0) {
                List<Map<String, String>> savedFiles = new ArrayList<>();

                for (MultipartFile file : files) {
                    if (file != null && !file.isEmpty()) {
                        try {
                            // Validate file
                            validateFile(file);

                            // Save file
                            String fileName = sanitizeFileName(file.getOriginalFilename());
                            String uniqueFileName = UUID.randomUUID() + "_" + fileName;
                            Path filePath = auditDirPath.resolve(uniqueFileName);

                            file.transferTo(filePath.toFile());

                            Map<String, String> fileInfo = new HashMap<>();
                            fileInfo.put("originalName", fileName);
                            fileInfo.put("storageName", uniqueFileName);
                            fileInfo.put("path", filePath.toString());
                            fileInfo.put("size", String.valueOf(file.getSize()));
                            fileInfo.put("contentType", file.getContentType());
                            fileInfo.put("uploadedAt", LocalDateTime.now().toString());

                            savedFiles.add(fileInfo);
                            totalFilesSaved++;

                            log.info("Saved file: {} for evidence type: {}", fileName, evidenceType);
                        } catch (IOException e) {
                            log.error("Error saving file: {}", file.getOriginalFilename(), e);
                            throw new RuntimeException("Failed to save file: " + file.getOriginalFilename(), e);
                        }
                    }
                }

                if (!savedFiles.isEmpty()) {
                    fileMetadata.put(evidenceType, savedFiles);
                }
            }
        }

        // Save audit report metadata
        Map<String, Object> auditReport = new HashMap<>();
        auditReport.put("applicationId", applicationId);
        auditReport.put("payload", payload);
        auditReport.put("files", fileMetadata);
        auditReport.put("savedAt", LocalDateTime.now().toString());
        auditReport.put("storageDirectory", appAuditDir);

        // Save metadata to JSON file
        String metadataFileName = "audit_report_metadata.json";
        Path metadataPath = auditDirPath.resolve(metadataFileName);
        String metadataJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(auditReport);
        Files.write(metadataPath, metadataJson.getBytes());

        log.info("Audit report saved successfully. Application: {}, Files: {}", applicationId, totalFilesSaved);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("applicationId", applicationId);
        response.put("filesSaved", totalFilesSaved);
        response.put("storageDirectory", appAuditDir);
        response.put("message", "Audit report saved successfully with " + totalFilesSaved + " file(s)");

        return response;
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed size: " + maxFileSize);
        }

        // Validate file type
        String contentType = file.getContentType();
        List<String> allowedTypes = Arrays.asList(
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/jpg",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new RuntimeException("File type not allowed: " + contentType);
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "file_" + System.currentTimeMillis();
        }
        // Remove potentially dangerous characters
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public String getAuditReportPath(Long applicationId) {
        File appDir = new File(storagePath + "/app_" + applicationId);
        if (appDir.exists()) {
            File[] subDirs = appDir.listFiles(File::isDirectory);
            if (subDirs != null && subDirs.length > 0) {
                // Return the most recent audit report directory
                return Arrays.stream(subDirs)
                        .max(Comparator.comparingLong(File::lastModified))
                        .map(File::getAbsolutePath)
                        .orElse(null);
            }
        }
        return null;
    }
}
