import json
import os
from functools import lru_cache
from typing import Optional

from logs import setup_logging
from models.config.config import Config

logger = setup_logging()

CONF = Config.get_instance()


@lru_cache(maxsize=128)
def get_secret(secret_name: str, region_name: str = "us-west-1") -> Optional[str]:
    """Get a secret from config, environment, or AWS Secrets Manager

    Priority order:
    1. Environment variable
    2. Config file (integrations section)
    3. AWS Secrets Manager (only if boto3 is available)

    Returns None if the secret is not found anywhere.
    """

    # Check environment variable first
    env_value = os.environ.get(secret_name)
    if env_value:
        logger.info(f"Returning secret value for '{secret_name}' from environment variable")
        return env_value

    # Check if secret exists in config (for local development)
    if CONF.has(secret_name, "integrations"):
        logger.info(f"Returning secret value for '{secret_name}' from config")
        return CONF.get(secret_name, "integrations")

    # Try AWS Secrets Manager only if boto3 is available
    try:
        import boto3
        from botocore.exceptions import ClientError

        # Create a Secrets Manager client
        session = boto3.session.Session()
        client = session.client(service_name="secretsmanager", region_name=region_name)

        try:
            logger.info(f"Attempting to retrieve secret '{secret_name}' from AWS Secrets Manager")
            get_secret_value_response = client.get_secret_value(SecretId=secret_name)
            logger.info(f"Successfully retrieved secret '{secret_name}' from AWS")
        except ClientError as e:
            logger.warning(f"Failed to retrieve secret '{secret_name}' from AWS: {str(e)}")
            return None

        # Get the secret string
        secret = get_secret_value_response["SecretString"]

        # Try to parse as JSON first (for secrets that contain multiple key-value pairs)
        try:
            secret_dict = json.loads(secret)
            # If the secret_name is a key in the dictionary, return its value
            if secret_name in secret_dict:
                return secret_dict.get(secret_name)
            # Otherwise return the entire dictionary or a specific value
            return secret_dict
        except json.JSONDecodeError:
            # If it's not JSON, return the raw string
            return secret

    except ImportError:
        logger.info("boto3 not available, skipping AWS Secrets Manager")
        return None
