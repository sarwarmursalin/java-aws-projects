package com.mursalin.cheque.fraud;

import com.mursalin.cheque.model.Cheque;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.ArrayList;

public class FraudRules {

    private static final BigDecimal STRUCTURING_LOW  = new BigDecimal("9900.00");
    private static final BigDecimal STRUCTURING_HIGH = new BigDecimal("9999.99");

    private static final Set<String> WATCHLIST = Set.of(
        "Shell Corp Ltd",
        "Quick Cash LLC",
        "Anonymous Holdings"
    );

    public List<String> check(Cheque cheque, Set<String> seenIds) {
        List<String> flags = new ArrayList<>();

        // Rule 1: STRUCTURING — amount just under $10,000 reporting threshold
        if (cheque.amount().compareTo(STRUCTURING_LOW) >= 0 &&
                cheque.amount().compareTo(STRUCTURING_HIGH) <= 0) {
            flags.add("STRUCTURING");
        }

        // Rule 2: DUPLICATE_ID — same id seen before
        if (seenIds.contains(cheque.id())) {
            flags.add("DUPLICATE_ID");
        }

        // Rule 3: WATCHLIST — payee is a flagged entity
        if (WATCHLIST.contains(cheque.payee())) {
            flags.add("WATCHLIST");
        }

        return flags;
    }
}
