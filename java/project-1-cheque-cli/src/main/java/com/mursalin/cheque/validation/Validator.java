package com.mursalin.cheque.validation;

import com.mursalin.cheque.model.Cheque;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.LocalDate;

import java.util.List;

public class Validator {

    public List<String> validate(Cheque cheque) {


        List<String> problems = new ArrayList<>();

        if (cheque.id() == null || cheque.id().isBlank())
            problems.add("id is blank");

        if (cheque.payer() == null || cheque.payer().isBlank())
            problems.add("payer is blank");

        if (cheque.payee() == null || cheque.payee().isBlank())
            problems.add("payee is blank");

        if (cheque.amount().compareTo(BigDecimal.ZERO) <= 0)
            problems.add("amount must be positive");

        if (!cheque.routingNumber().matches("\\d{9}"))
            problems.add("routingNumber must be 9 digits");

        if (cheque.date().isAfter(LocalDate.now()))
            problems.add("date is in the future");

        return problems;


    }
}
