package com.mursalin.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DocumentRequest(
        @NotBlank String title,
        @NotBlank String owner,
        @NotBlank String fileType,
        @NotNull Long fileSizeBytes
) {
}
