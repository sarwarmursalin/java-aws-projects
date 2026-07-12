package com.mursalin.cheque.api.dto;

public record ChequeRequest(
        String id,
        String payer,
        String payee,
        String amount,
        String routingNumber,
        String date
) {}