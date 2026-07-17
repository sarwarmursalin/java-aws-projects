import pytest
from pyspark.sql import SparkSession

from transform import (
    clean_transactions,
    fraud_rate_by_type,
    account_summary,
    enrich_with_account_risk,
)


@pytest.fixture(scope="module")
def spark():
    spark = SparkSession.builder.appName("test-transform").master("local[1]").getOrCreate()
    yield spark
    spark.stop()


def test_clean_transactions_filters_non_positive_amounts(spark):
    df = spark.createDataFrame(
        [("PAYMENT", 100.0), ("PAYMENT", 0.0), ("PAYMENT", -50.0)],
        ["type", "amount"],
    )
    result = clean_transactions(df)
    assert result.count() == 1


def test_clean_transactions_buckets_amount(spark):
    df = spark.createDataFrame(
        [("PAYMENT", 500.0), ("PAYMENT", 5000.0), ("PAYMENT", 500000.0)],
        ["type", "amount"],
    )
    result = clean_transactions(df)
    buckets = {row["amount_bucket"] for row in result.collect()}
    assert buckets == {"small", "medium", "large"}


def test_fraud_rate_by_type_computes_correct_rate(spark):
    df = spark.createDataFrame(
        [("PAYMENT", 1), ("PAYMENT", 0), ("TRANSFER", 1), ("TRANSFER", 1)],
        ["type", "isFraud"],
    )
    result = {row["type"]: row["fraud_rate"] for row in fraud_rate_by_type(df).collect()}
    assert result["PAYMENT"] == pytest.approx(0.5)
    assert result["TRANSFER"] == pytest.approx(1.0)


def test_account_summary_aggregates_per_account(spark):
    df = spark.createDataFrame(
        [("A1", 100.0, 0), ("A1", 200.0, 1), ("A2", 50.0, 0)],
        ["nameOrig", "amount", "isFraud"],
    )
    result = {row["nameOrig"]: row for row in account_summary(df).collect()}
    assert result["A1"]["txn_count"] == 2
    assert result["A1"]["total_sent"] == 300.0
    assert result["A1"]["fraud_count"] == 1
    assert result["A2"]["fraud_count"] == 0
exit


def test_enrich_with_account_risk_joins_sender_fraud_count(spark):
    transactions = spark.createDataFrame([("A1", 100.0), ("A2", 50.0)], ["nameOrig", "amount"])
    accounts = spark.createDataFrame([("A1", 3)], ["nameOrig", "fraud_count"])
    result = {
        row["nameOrig"]: row["sender_fraud_count"]
        for row in enrich_with_account_risk(transactions, accounts).collect()
    }
    assert result["A1"] == 3
    assert result["A2"] is None  # left join — no history for A2