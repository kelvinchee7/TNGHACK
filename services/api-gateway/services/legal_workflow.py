"""
LegalAdvisorWorkflow — generates approval tokens and dispatches SES emails.
In local mode, prints the token to stdout instead of sending email.
"""
import time
import jwt as pyjwt
from ..config import settings


class LegalAdvisorWorkflow:

    @staticmethod
    def dispatch(estate, advisor_email: str) -> str:
        token = _generate_token(estate.id, advisor_email)
        approval_url = f"http://localhost:5173/legal/review/{token}"

        if settings.use_real_ses:
            _send_ses_email(estate, advisor_email, approval_url)
        else:
            print(f"\n[DEV] Legal advisor approval URL for {advisor_email}:")
            print(f"  {approval_url}\n")

        return token


def _generate_token(estate_id: str, advisor_email: str) -> str:
    payload = {
        "estate_id": estate_id,
        "advisor_email": advisor_email,
        "exp": int(time.time()) + settings.jwt_advisor_expiry_hours * 3600,
    }
    return pyjwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _send_ses_email(estate, advisor_email: str, approval_url: str) -> None:
    import boto3
    client = boto3.client("ses", region_name=settings.aws_region)
    client.send_email(
        Source=settings.ses_sender,
        Destination={"ToAddresses": [advisor_email]},
        Message={
            "Subject": {"Data": f"[iwantmoney] Legal Review Required — Estate {estate.id[:8]}"},
            "Body": {
                "Html": {
                    "Data": _build_email_html(estate, approval_url)
                }
            },
        },
    )


def _build_email_html(estate, approval_url: str) -> str:
    return f"""
<html><body style="font-family:sans-serif;color:#1a1a2e;background:#f4f6f9;padding:32px">
<div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;
            box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <h2 style="color:#003DA5">iwantmoney — Legal Review Required</h2>
  <p>A probate estate requires your review and approval before asset distribution.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#64748b">Deceased</td>
        <td style="padding:8px;font-weight:600">{estate.deceased_name_enc}</td></tr>
    <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Total Estate</td>
        <td style="padding:8px;font-weight:600">RM {float(estate.total_rm):,.2f}</td></tr>
    <tr><td style="padding:8px;color:#64748b">Death Date</td>
        <td style="padding:8px">{estate.death_date}</td></tr>
  </table>
  <a href="{approval_url}"
     style="display:inline-block;background:#003DA5;color:#fff;padding:14px 28px;
            border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
    Review &amp; Approve Distribution
  </a>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px">
    This link expires in 72 hours. If you did not expect this email, contact TNG Digital support.
  </p>
</div>
</body></html>
"""
