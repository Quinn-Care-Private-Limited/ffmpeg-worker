import json
import os
import logging

logger = logging.getLogger(__name__)

def setup_storage_credentials():
    import base64

    gcp_credentials = os.environ.get("GCP_CREDENTIALS")
    aws_credentials = os.environ.get("AWS_CREDENTIALS")
    gcp_credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    aws_config_file_path = os.environ.get("AWS_CONFIG_FILE")
    aws_shared_credentials_file_path = os.environ.get("AWS_SHARED_CREDENTIALS_FILE")

    # if gcp_credentials is set, set it in gcp credentials file
    if gcp_credentials:
        with open(gcp_credentials_path, "w") as f:
            f.write(base64.b64decode(gcp_credentials).decode("utf-8"))
    elif aws_credentials:
        credentials = json.loads(base64.b64decode(aws_credentials).decode("utf-8"))

        with open(aws_config_file_path, "w") as f:
            content = f"""[default]
            region = {credentials["region_name"]}
            output = json"""
            f.write(content)

        with open(aws_shared_credentials_file_path, "w") as f:
            content = f"""[default]
            aws_access_key_id = {credentials["aws_access_key_id"]}
            aws_secret_access_key = {credentials["aws_secret_access_key"]}"""
            f.write(content)
    else:
        logger.info("No storage credentials set")


def upload_file(bucket, key, file_path, cloud_type="GCP", credentials=None):
    """
    Uploads a file to a cloud storage bucket (GCP or AWS).

    Args:
    - bucket (str): The name of the bucket to upload to.
    - key (str): The key/path to upload the file to.
    - file_path (str): The path to the file to upload.
    - cloud_type (str): Either "GCP" for Google Cloud Storage or "AWS" for S3.
    - credentials (dict): Optional credentials for cloud provider.
    """

    if cloud_type == "AWS":
        import boto3

        # Initialize S3 client
        aws_url = credentials.get("aws_url") if credentials else None
        aws_public_url = credentials.get("aws_public_url") if credentials else None

        if credentials:
            # Check if custom endpoint URL is provided (for S3-compatible services)
            if aws_url:
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=credentials.get("aws_access_key_id"),
                    aws_secret_access_key=credentials.get("aws_secret_access_key"),
                    endpoint_url=aws_url,
                    region_name="auto",
                )
            else:
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=credentials.get("aws_access_key_id"),
                    aws_secret_access_key=credentials.get("aws_secret_access_key"),
                    region_name=credentials.get("region_name", "us-east-1"),
                )
        else:
            # Use default credentials from environment/IAM role
            s3_client = boto3.client("s3")

        # Upload file to S3
        s3_client.upload_file(file_path, bucket, key)
        logger.info(f"File {file_path} uploaded to S3 bucket {bucket} at {key}.")

        # Generate the S3 URL
        if aws_public_url:
            url = f"{aws_public_url}/{key}"
        elif aws_url:
            # Cloudflare doesn't provide a default URL for R2 buckets
            url = None
        else:
            region = (
                credentials.get("region_name", "us-east-1")
                if credentials
                else "us-east-1"
            )
            url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

        os.remove(file_path)

        return url

    else:  # Default to GCP
        from google.cloud import storage

        if credentials:
            storage_client = storage.Client.from_service_account_json(credentials)
        else:
            storage_client = storage.Client()
        bucket_obj = storage_client.bucket(bucket)

        blob = bucket_obj.blob(key)
        blob.upload_from_filename(file_path)
        logger.info(f"File {file_path} uploaded to GCS bucket {bucket} at {key}.")
        os.remove(file_path)

        # return the url of the uploaded file
        return blob.public_url
