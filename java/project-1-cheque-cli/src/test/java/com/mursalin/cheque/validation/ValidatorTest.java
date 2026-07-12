package com.mursalin.cheque.validation;

import com.mursalin.cheque.model.Cheque;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ValidatorTest {

    private final Validator validator = new Validator();

    // A fully correct cheque — reused across tests as the baseline
    private Cheque valid() {
        return new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                new BigDecimal("5000.00"), "021000021", LocalDate.of(2024, 3, 15));
    }

    @Test
    void validChequeReturnsNoProblems() {
        List<String> problems = validator.validate(valid());
        assertTrue(problems.isEmpty());
    }

    @Test
    void blankIdIsRejected() {
        Cheque c = new Cheque("", "Alice Corp", "Bob LLC",
                new BigDecimal("5000.00"), "021000021", LocalDate.of(2024, 3, 15));

        List<String> problems = validator.validate(c);

        assertFalse(problems.isEmpty());
        assertTrue(problems.stream().anyMatch(p -> p.contains("id")));
    }

    @Test
    void blankPayerIsRejected() {
        Cheque c = new Cheque("CHQ-001", "", "Bob LLC",
                new BigDecimal("5000.00"), "021000021", LocalDate.of(2024, 3, 15));

        assertFalse(validator.validate(c).isEmpty());
    }

    @Test
    void zeroAmountIsRejected() {
        Cheque c = new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                BigDecimal.ZERO, "021000021", LocalDate.of(2024, 3, 15));

        assertFalse(validator.validate(c).isEmpty());
    }

    @Test
    void negativeAmountIsRejected() {
        Cheque c = new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                new BigDecimal("-100.00"), "021000021", LocalDate.of(2024, 3, 15));

        assertFalse(validator.validate(c).isEmpty());
    }

    @Test
    void shortRoutingNumberIsRejected() {
        Cheque c = new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                new BigDecimal("5000.00"), "12345", LocalDate.of(2024, 3, 15));

        assertFalse(validator.validate(c).isEmpty());
    }

    @Test
    void futureDateIsRejected() {
        Cheque c = new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                new BigDecimal("5000.00"), "021000021", LocalDate.now().plusDays(1));

        assertFalse(validator.validate(c).isEmpty());
    }

    @Test
    void todayDateIsAccepted() {
        Cheque c = new Cheque("CHQ-001", "Alice Corp", "Bob LLC",
                new BigDecimal("5000.00"), "021000021", LocalDate.now());

        assertTrue(validator.validate(c).isEmpty());
    }
}
