package com.halalcms.applicationservice.service;

import com.halalcms.applicationservice.dto.UserDocumentDto;
import com.halalcms.applicationservice.dto.UserDocumentsDto;
import com.halalcms.applicationservice.model.ApplicationDocument;
import com.halalcms.applicationservice.repository.ApplicationDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final ApplicationDocumentRepository documentRepository;

    public UserDocumentsDto getDocuments(Long applicationId) {
        List<ApplicationDocument> docs = documentRepository.findByApplicationId(applicationId);
        List<UserDocumentDto> dtos = docs.stream().map(d -> UserDocumentDto.builder()
                .id(d.getId())
                .filename(d.getFilename())
                .description(d.getDescription())
                .uploadedAt(d.getUploadedAt() != null ? d.getUploadedAt().format(FORMATTER) : null)
                .url(d.getUrl())
                .build()).toList();
        return UserDocumentsDto.builder().documents(dtos).build();
    }
}
