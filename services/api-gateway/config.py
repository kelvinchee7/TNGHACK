import os


class Settings:
    # Database
    database_url: str = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/probate")

    # JWT
    jwt_secret: str = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_advisor_expiry_hours: int = 72

    # AWS
    aws_region: str = os.environ.get("AWS_REGION", "ap-southeast-1")
    sns_security_alerts_arn: str = os.environ.get("SNS_SECURITY_ALERTS_ARN", "")
    sns_estate_events_arn: str = os.environ.get("SNS_ESTATE_EVENTS_ARN", "")
    ses_sender: str = os.environ.get("SES_SENDER", "noreply@iwantmoney.com.my")

    # Alibaba OSS
    oss_access_key_id: str = os.environ.get("OSS_ACCESS_KEY_ID", "")
    oss_access_key_secret: str = os.environ.get("OSS_ACCESS_KEY_SECRET", "")
    oss_bucket: str = os.environ.get("OSS_BUCKET", "iwantmoney-docs-prod")
    oss_endpoint: str = os.environ.get("OSS_ENDPOINT", "https://oss-ap-southeast-1.aliyuncs.com")

    # TNG mock
    tng_api_base: str = os.environ.get("TNG_API_BASE", "http://localhost:9001")
    tng_api_key: str = os.environ.get("TNG_API_KEY", "mock-tng-key")

    # Wise
    wise_api_base: str = os.environ.get("WISE_API_BASE", "https://api.sandbox.transferwise.tech")
    wise_api_key: str = os.environ.get("WISE_API_KEY", "")
    wise_profile_id: str = os.environ.get("WISE_PROFILE_ID", "")
    wise_webhook_secret: str = os.environ.get("WISE_WEBHOOK_SECRET", "")

    # Feature flags
    use_real_oss: bool = os.environ.get("USE_REAL_OSS", "false").lower() == "true"
    use_real_textract: bool = os.environ.get("USE_REAL_TEXTRACT", "false").lower() == "true"
    use_real_sns: bool = os.environ.get("USE_REAL_SNS", "false").lower() == "true"
    use_real_ses: bool = os.environ.get("USE_REAL_SES", "false").lower() == "true"


settings = Settings()
