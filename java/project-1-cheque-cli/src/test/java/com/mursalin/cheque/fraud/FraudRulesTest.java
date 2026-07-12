package com.mursalin.cheque.fraud;

import com.mursalin.cheque.model.Cheque;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class FraudRulesTest {

    private final FraudRules fraudRules = new FraudRules();
    private final LocalDate date = LocalDate.of(2024, 3, 15);

    private Cheque cheque(String id, String payee, String amount) {
        return new Cheque(id, "Alice Corp", payee, new BigDecimal(amount), "021000021", date);
    }

    @Test
    void cleanChequeHasNoFlags() {
        Cheque c = cheque("CHQ-001", "Bob LLC", "5000.00");
        List<String> flags = fraudRules.check(c, Set.of());
        assertTrue(flags.isEmpty());
    }

    @Test
    void structuringFlaggedAtLowerBound() {
        Cheque c = cheque("CHQ-001", "Bob LLC", "9900.00");
        assertTrue(fraudRules.check(c, Set.of()).contains("STRUCTURING"));
    }

    @Test
    void structuringFlaggedAtUpperBound() {
        Cheque c = cheque("CHQ-001", "Bob LLC", "9999.99");
        assertTrue(fraudRules.check(c, Set.of()).contains("STRUCTURING"));
    }

    @Test
    void amountAboveThresholdNotFlaggedForStructuring() {
        Cheque c = cheque("CHQ-001", "Bob LLC", "10000.00");
        assertFalse(fraudRules.check(c, Set.of()).contains("STRUCTURING"));
    }

    @Test
    void duplicateIdIsFlagged() {
        Cheque c = cheque("CHQ-001", "Bob LLC", "5000.00");
        // CHQ-001 is already in seenIds — simulates a replay
        List<String> flags = fraudRules.check(c, Set.of("CHQ-001"));
        assertTrue(flags.contains("DUPLICATE_ID"));
    }

    @Test
    void newIdIsNotFlaggedAsDuplicate() {
        Cheque c = cheque("CHQ-999", "Bob LLC", "5000.00");
        assertFalse(fraudRules.check(c, Set.of("CHQ-001")).contains("DUPLICATE_ID"));
    }

    @Test
    void watchlistPayeeIsFlagged() {
        Cheque c = cheque("CHQ-001", "Shell Corp Ltd", "5000.00");
        assertTrue(fraudRules.check(c, Set.of()).contains("WATCHLIST"));
    }

    @Test
    void unknownPayeeIsNotFlagged() {
        Cheque c = cheque("CHQ-001", "Legit Business Inc", "5000.00");
        assertFalse(fraudRules.check(c, Set.of()).contains("WATCHLIST"));
    }

    @Test
    void chequeCanHaveMultipleFlags() {
        // Structuring amount + watchlist payee + duplicate id = 3 flags at once
        Cheque c = cheque("CHQ-001", "Shell Corp Ltd", "9950.00");
        List<String> flags = fraudRules.check(c, Set.of("CHQ-001"));

        assertTrue(flags.contains("STRUCTURING"));
        assertTrue(flags.contains("DUPLICATE_ID"));
        assertTrue(flags.contains("WATCHLIST"));
        assertEquals(3, flags.size());
    }
}
