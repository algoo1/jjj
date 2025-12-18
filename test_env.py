import os
from dotenv import load_dotenv
import boto3

load_dotenv()

print("Checking Env:")
keys = ["R2_ENDPOINT_URL", "R2_BUCKET_NAME", "R2_PUBLIC_URL", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]
for k in keys:
    val = os.getenv(k)
    print(f"{k}: {'Found' if val else 'Missing'} - Length: {len(val) if val else 0}")

print("\nTesting Boto3 Init...")
try:
    s3 = boto3.client(
        's3',
        endpoint_url=os.getenv("R2_ENDPOINT_URL"),
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        region_name='auto'
    )
    print("Boto3 Client Initialized.")
except Exception as e:
    print(f"Boto3 Init Failed: {e}")
