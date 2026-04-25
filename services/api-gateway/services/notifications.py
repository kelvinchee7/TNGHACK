"""
Notification helpers — SNS publish (prod) or stdout (dev).
Alert email target: kelvinchee37@gmail.com (subscribed to SNS topic).
"""
import json
from ..config import settings


def notify(event_type: str, payload: dict) -> None:
    if settings.use_real_sns and settings.sns_security_alerts_arn:
        _publish_sns(settings.sns_security_alerts_arn, event_type, payload)
    else:
        print(f"[NOTIFY] {event_type}: {json.dumps(payload)}")


def publish_estate_event(event_type: str, payload: dict) -> None:
    if settings.use_real_sns and settings.sns_estate_events_arn:
        _publish_sns(settings.sns_estate_events_arn, event_type, payload)
    else:
        print(f"[ESTATE EVENT] {event_type}: {json.dumps(payload)}")


def send_magic_link(email: str, claim_id: str) -> None:
    link = f"http://localhost:5173/portal?claim={claim_id}"
    if settings.use_real_ses:
        import boto3
        client = boto3.client("ses", region_name=settings.aws_region)
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


def _publish_sns(topic_arn: str, event_type: str, payload: dict) -> None:
    import boto3
    client = boto3.client("sns", region_name=settings.aws_region)
    client.publish(
        TopicArn=topic_arn,
        Subject=f"[iwantmoney] {event_type}",
        Message=json.dumps({"event": event_type, **payload}),
    )
