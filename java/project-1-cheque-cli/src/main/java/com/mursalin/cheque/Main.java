package com.mursalin.cheque;

import com.mursalin.cheque.model.Cheque;

import com.mursalin.cheque.fraud.FraudRules;
import com.mursalin.cheque.validation.Validator;
import java.util.stream.Collectors;
import java.util.Set;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    public static void main(String[] args) {
        List<Cheque> cheques = List.of(
            new Cheque("CHQ-001", "Alice Corp",   "Bob LLC",        new BigDecimal("5000.00"), "021000021", LocalDate.of(2024, 3, 15)),
            new Cheque("CHQ-001", "Golam Corp",   "Bob LLC",        new BigDecimal("4351.00"), "021000021", LocalDate.of(2024, 4, 12)),
            new Cheque("CHQ-002", "Exon Corp",    "Bob LLC",        new BigDecimal("9950.00"), "021000021", LocalDate.of(2024, 6,  4)),
            new Cheque("CHQ-003", "Neson Corp",   "Shell Corp Ltd", new BigDecimal("1248.00"), "021000021", LocalDate.of(2024, 7, 16)),
            new Cheque("CHQ-004", "Logi Corp",    "Bob LLC",        new BigDecimal("3400.00"), "021000021", LocalDate.of(2023, 1, 21)),
            new Cheque("CHQ-005", "Tanson Corp",  "Bob LLC",        new BigDecimal("1200.00"), "021000021", LocalDate.of(2025, 3, 15))
        );

        Validator validator = new Validator();
        FraudRules fraudRules = new FraudRules();

        // Build set of duplicate ids using streams
        Set<String> duplicateIds = cheques.stream()
                .collect(Collectors.groupingBy(Cheque::id, Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        // Partition: valid data (true) vs rejected/malformed (false)
        Map<Boolean, List<Cheque>> byValidity = cheques.stream()
                .collect(Collectors.partitioningBy(c -> validator.validate(c).isEmpty()));

        List<Cheque> validOrFlagged = byValidity.get(true);
        List<Cheque> rejected       = byValidity.get(false);

        // Partition valid ones: clean (true) vs fraud-flagged (false)
        Map<Boolean, List<Cheque>> byFraud = validOrFlagged.stream()
                .collect(Collectors.partitioningBy(c -> fraudRules.check(c, duplicateIds).isEmpty()));

        List<Cheque> clean   = byFraud.get(true);
        List<Cheque> flagged = byFraud.get(false);

        // Print summary
        System.out.println("Processed " + cheques.size() + " cheques");
        System.out.println("  V Valid:    " + clean.size());
        System.out.println("  ! Flagged:  " + flagged.size());
        System.out.println("  X Rejected: " + rejected.size());

        System.out.println("\nFLAGGED:");
        flagged.forEach(c -> System.out.println("  " + c.id() + " -> " + fraudRules.check(c, duplicateIds)));

        System.out.println("\nREJECTED:");
        rejected.forEach(c -> System.out.println("  " + c.id() + " -> " + validator.validate(c)));
    }
}
