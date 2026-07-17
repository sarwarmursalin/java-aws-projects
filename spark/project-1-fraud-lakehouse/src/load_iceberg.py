from pyspark.sql import SparkSession, DataFrame


def create_spark_session() -> SparkSession:
    return SparkSession.builder.appName("load-paysim").getOrCreate()


def load_raw_transactions(spark: SparkSession, csv_path: str) -> DataFrame:
    return (
        spark.read
        .option("header", "true")
        .option("inferSchema", "true")
        .csv(csv_path)
    )


def write_to_iceberg(df: DataFrame, table_name: str) -> None:
    df.sparkSession.sql("CREATE DATABASE IF NOT EXISTS demo.fraud")
    df.writeTo(table_name).createOrReplace()


def main() -> None:
    spark = create_spark_session()
    df = load_raw_transactions(spark, "/home/iceberg/data/paysim.csv")
    write_to_iceberg(df, "demo.fraud.transactions")
    print(f"Loaded {df.count()} rows into demo.fraud.transactions")
    spark.sql("SELECT * FROM demo.fraud.transactions LIMIT 5").show()


if __name__ == "__main__":
    main()