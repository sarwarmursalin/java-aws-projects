package com.mursalin.document.dto;

import com.mursalin.document.model.Document;
import com.mursalin.document.model.Tag;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record DocumentResponse(
        Long id,
        String title,
        String owner,
        String fileType,
        Long fileSizeBytes,
        LocalDateTime uploadedAt,
        Set<String> tagNames
) {
    public static DocumentResponse from(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getTitle(),
                document.getOwner(),
                document.getFileType(),
                document.getFileSizeBytes(),
                document.getUploadedAt(),
                document.getTags().stream().map(Tag::getName).collect(Collectors.toSet())
        );
    }
}
