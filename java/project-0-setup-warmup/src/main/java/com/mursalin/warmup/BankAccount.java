package com.mursalin.warmup;

import java.util.Objects;

/**
 * Milestone 2 — IMPLEMENT THIS YOURSELF.
 *
 * The method bodies are left as TODOs on purpose: typing them is how you learn
 * Java's syntax and rules. The signatures and hints are here to guide you.
 *
 * When you're done, uncomment the demo in Main.java and run it.
 */
public class BankAccount {

    // TODO: declare private fields — owner (String) and balance.
    //       Hint: prefer `long balanceCents` over `double` for money (no float rounding bugs).
    private final String owner;
    private double balance;

    public BankAccount(String owner, double startingBalance) {
        // TODO: validate owner is not null/blank; set fields.
        if (owner == null || owner.isBlank()){
            throw new IllegalArgumentException("owner name cannot be blank");
        }
        this.owner = owner;
        this.balance = startingBalance;
    }

    public void deposit(double amount) {
        // TODO: reject amount <= 0 with new IllegalArgumentException("...");
        //       otherwise add to balance.
        if (amount <= 0){
            throw new IllegalArgumentException("Deposit must be positive, got:"+ amount);
        }
        else balance = balance + amount;
        // throw new UnsupportedOperationException("implement deposit");
    }

    public void withdraw(double amount) {
        // TODO: reject amount <= 0, and reject overdraft (balance - amount < 0),
        //       each with a clear IllegalArgumentException message.
        //throw new UnsupportedOperationException("implement withdraw");
        if(amount <= 0){
            throw  new IllegalArgumentException("Withdrawal must be positive, got:"+ amount);
        }
        if(amount > balance){
            throw new IllegalArgumentException("Insufficient funds: balance=" + balance + ", requested=" + amount);

        }
        balance = balance -amount;
    }

    public double getBalance() {
        return balance;
    }

    public String getOwner() {
        return owner;
    }

    @Override
    public String toString() {
        // TODO: return something like "BankAccount{owner=Alice, balance=120.0}"
        return "BankAccount{owner=" + owner + ", balance=" + balance + "}";
    }

    // equals/hashCode keyed on `owner` — this is the contract you must explain in interviews.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BankAccount that = (BankAccount) o;
        return Objects.equals(owner, that.owner);
    }

    @Override
    public int hashCode() {
        return Objects.hash(owner);
    }
}
