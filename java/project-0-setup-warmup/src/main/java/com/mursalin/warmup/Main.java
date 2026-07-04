package com.mursalin.warmup;

/**
 * Project 0 starter. If this prints when you run `mvn -q compile exec:java`,
 * your toolchain works (Milestone 1).
 *
 * Then implement BankAccount (Milestone 2) and replace the demo below with
 * real account operations.
 */
public class Main {

    public static void main(String[] args) {

         //---- Milestone 2: uncomment and flesh out once BankAccount is implemented ----

         BankAccount alice = new BankAccount("Alice", 100.0);
         BankAccount bob   = new BankAccount("Bob", 0.0);

         alice.deposit(50.0);
         alice.withdraw(30.0);
         System.out.println(alice);   // expect Alice with balance 120.0

         try {
             bob.withdraw(10.0);      // overdraft -> should throw
         } catch (IllegalArgumentException e) {
             System.out.println("Rejected as expected: " + e.getMessage());
         }

         // Why .equals() and not == ? Two distinct objects, same owner:
         BankAccount aliceAgain = new BankAccount("Alice", 999.0);
         System.out.println("== gives:      " + (alice == aliceAgain));      // false (identity)
         System.out.println(".equals gives: " + alice.equals(aliceAgain));   // true if you key on owner
    }
}
