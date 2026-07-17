from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F


def flag_suspicious_transactions(df: DataFrame) -> DataFrame:
    return df.withColumn(
        "rule_flag",
        (
            F.col("type").isin("TRANSFER", "CASH_OUT")
            & (F.col("oldbalanceOrg") == F.col("amount"))
            & (F.col("newbalanceOrig") == 0)
        ),
    )


def evaluate_flags(df: DataFrame) -> DataFrame:
    return df.groupBy("isFraud", "rule_flag").agg(F.count("*").alias("count"))


def main() -> None:
    spark = SparkSession.builder.appName("flag-fraud").getOrCreate()

    transactions = spark.table("demo.fraud.transactions")
    flagged = flag_suspicious_transactions(transactions)

    flagged.writeTo("demo.fraud.flagged_transactions").createOrReplace()

    print("Confusion matrix (isFraud vs rule_flag):")
    evaluate_flags(flagged).orderBy("isFraud", "rule_flag").show()


if __name__ == "__main__":
    main()