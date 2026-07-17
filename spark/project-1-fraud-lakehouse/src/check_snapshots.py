from pyiceberg.catalog import load_catalog

catalog = load_catalog(
    "demo",
    uri="http://rest:8181",
    **{
        "s3.endpoint": "http://minio:9000",
        "s3.access-key-id": "admin",
        "s3.secret-access-key": "password",
    },
)

table = catalog.load_table("fraud.account_summary")

print("Current snapshot:", table.current_snapshot())
print()
for snap in table.snapshots():
    print(snap.snapshot_id, snap.timestamp_ms, snap.summary.operation)