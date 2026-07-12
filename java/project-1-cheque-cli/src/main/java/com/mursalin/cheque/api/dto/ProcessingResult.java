package com.mursalin.cheque.api.dto;

import java.util.List;

public record ProcessingResult(
        int total,
        int valid,
        int flagged,
        int rejected,
        List<String> flaggedItems,
        List<String> rejectedItems
) {}