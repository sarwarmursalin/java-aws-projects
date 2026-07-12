package com.mursalin.cheque.api;

import com.mursalin.cheque.api.dto.ChequeRequest;
import com.mursalin.cheque.api.dto.ProcessingResult;
import com.mursalin.cheque.fraud.FraudRules;
import com.mursalin.cheque.model.Cheque;
import com.mursalin.cheque.validation.Validator;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cheques")
public class ChequeController {

    private final Validator validator = new Validator();
    private final FraudRules fraudRules = new FraudRules();

    @PostMapping("/process")
    public ProcessingResult process(@RequestBody List<ChequeRequest> requests) {
        List<Cheque> cheques = requests.stream()
                .map(r -> new Cheque(r.id(), r.payer(), r.payee(),
                        new BigDecimal(r.amount()), r.routingNumber(),
                        LocalDate.parse(r.date())))
                .toList();

        Set<String> duplicateIds = cheques.stream()
                .collect(Collectors.groupingBy(Cheque::id, Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        Map<Boolean, List<Cheque>> byValidity = cheques.stream()
                .collect(Collectors.partitioningBy(c -> validator.validate(c).isEmpty()));

        List<Cheque> validOrFlagged = byValidity.get(true);
        List<Cheque> rejected       = byValidity.get(false);

        Map<Boolean, List<Cheque>> byFraud = validOrFlagged.stream()
                .collect(Collectors.partitioningBy(c -> fraudRules.check(c, duplicateIds).isEmpty()));

        List<Cheque> clean   = byFraud.get(true);
        List<Cheque> flagged = byFraud.get(false);

        List<String> flaggedItems = flagged.stream()
                .map(c -> c.id() + " -> " + fraudRules.check(c, duplicateIds))
                .toList();

        List<String> rejectedItems = rejected.stream()
                .map(c -> c.id() + " -> " + validator.validate(c))
                .toList();

        return new ProcessingResult(cheques.size(), clean.size(),
                flagged.size(), rejected.size(), flaggedItems, rejectedItems);
    }
}