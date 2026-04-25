"""
Notification helpers — stdout only (SNS removed).
"""
import json
from config import settings


def notify(event_type: str, payload: dict) -> None:
    print(f"[NOTIFY] {event_type}: {json.dumps(payload)}")


def publish_estate_event(event_type: str, payload: dict) -> None:
    print(f"[ESTATE EVENT] {event_type}: {json.dumps(payload)}")


def send_magic_link(email: str, claim_id: str) -> None:
    link = f"http://localhost:5173/portal?claim={claim_id}"
    if settings.use_real_ses:
        import boto3
        session = boto3.Session(profile_name='finhack')
        client = session.client("ses", region_name=settings.aws_region)
        client.send_email(
            Source=settings.ses_sender,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": "[iwantmoney] Your Claim Link"},
                "Body": {"Text": {"Data": f"Access your claim status here: {link}"}},
            },
        )
    else:
        print(f"[DEV] Magic link for {email}: {link}")


