from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F


def clean_transactions(df: DataFrame) -> DataFrame:
    return (
        df.filter(F.col("amount") > 0)
        .withColumn(
            "amount_bucket",
            F.when(F.col("amount") < 1000, "small")
             .when(F.col("amount") < 100000, "medium")
             .otherwise("large"),
        )
    )


def fraud_rate_by_type(df: DataFrame) -> DataFrame:
    return (
        df.groupBy("type")
        .agg(
            F.count("*").alias("txn_count"),
            F.sum("isFraud").alias("fraud_count"),
        )
        .withColumn("fraud_rate", F.col("fraud_count") / F.col("txn_count"))
        .orderBy(F.desc("fraud_rate"))
    )


def account_summary(df: DataFrame) -> DataFrame:
    return (
        df.groupBy("nameOrig")
        .agg(
            F.count("*").alias("txn_count"),
            F.sum("amount").alias("total_sent"),
            F.sum("isFraud").alias("fraud_count"),
        )
    )


def enrich_with_account_risk(transactions: DataFrame, accounts: DataFrame) -> DataFrame:
    risk = accounts.select(
        F.col("nameOrig").alias("_risk_account"),
        F.col("fraud_count").alias("sender_fraud_count"),
    )
    return (
        transactions.join(risk, transactions.nameOrig == risk._risk_account, "left")
        .drop("_risk_account")
    )


def main() -> None:
    spark = SparkSession.builder.appName("transform-paysim").getOrCreate()

    transactions = spark.table("demo.fraud.transactions")
    cleaned = clean_transactions(transactions)

    fraud_rates = fraud_rate_by_type(cleaned)
    fraud_rates.writeTo("demo.fraud.fraud_rate_by_type").createOrReplace()
    fraud_rates.show()

    accounts = account_summary(cleaned)
    accounts.writeTo("demo.fraud.account_summary").createOrReplace()

    enriched = enrich_with_account_risk(cleaned, accounts)
    enriched.writeTo("demo.fraud.transactions_enriched").createOrReplace()
    enriched.select("nameOrig", "amount", "amount_bucket", "sender_fraud_count", "isFraud").show(5)


if __name__ == "__main__":
    main()