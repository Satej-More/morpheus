import httpx
import logging
from typing import Optional
from config.settings import get_settings

logger = logging.getLogger(__name__)


class GitHubService:
    """Creates issues and PRs in GitHub for incident tracking."""

    def __init__(self):
        s = get_settings()
        self.token = s.github_token
        self.repo = s.github_repo       # "org/repo"
        self._headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def create_issue(
        self,
        title: str,
        body: str,
        labels: Optional[list[str]] = None,
        assignees: Optional[list[str]] = None,
    ) -> dict:
        """Create a GitHub issue for an incident."""
        if not self.token or not self.repo:
            logger.warning("GitHub not configured — returning mock issue")
            return self._mock_issue(title)

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"https://api.github.com/repos/{self.repo}/issues",
                    headers=self._headers,
                    json={
                        "title": title,
                        "body": body,
                        "labels": labels or ["morpheus-auto", "incident"],
                        "assignees": assignees or [],
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "number": data["number"],
                    "url": data["html_url"],
                    "id": str(data["id"]),
                }
            except httpx.HTTPError as e:
                logger.error("GitHub issue creation failed: %s", e)
                return self._mock_issue(title)

    async def close_issue(self, issue_number: int, comment: str) -> bool:
        """Close a GitHub issue with a resolution comment."""
        if not self.token or not self.repo:
            return False

        async with httpx.AsyncClient() as client:
            try:
                # Add resolution comment
                await client.post(
                    f"https://api.github.com/repos/{self.repo}/issues/{issue_number}/comments",
                    headers=self._headers,
                    json={"body": comment},
                    timeout=15,
                )
                # Close the issue
                await client.patch(
                    f"https://api.github.com/repos/{self.repo}/issues/{issue_number}",
                    headers=self._headers,
                    json={"state": "closed"},
                    timeout=15,
                )
                return True
            except httpx.HTTPError as e:
                logger.error("GitHub issue close failed: %s", e)
                return False

    def _mock_issue(self, title: str) -> dict:
        import random
        n = random.randint(800, 900)
        return {
            "number": n,
            "url": f"https://github.com/demo-org/payments-service/issues/{n}",
            "id": str(n),
        }

    def build_issue_labels(self, severity: str, service: str) -> list[str]:
        labels = ["morpheus-auto", "incident", service]
        if severity == "critical":
            labels.append("P1-critical")
        elif severity == "high":
            labels.append("P2-high")
        return labels


class SlackService:
    """Sends structured incident notifications to Slack."""

    def __init__(self):
        s = get_settings()
        self.webhook_url = s.slack_webhook_url
        self.default_channel = s.slack_channel

    async def post_incident(
        self,
        incident_id: str,
        title: str,
        severity: str,
        service: str,
        root_cause: Optional[str],
        confidence: Optional[float],
        github_url: Optional[str],
    ) -> bool:
        """Post a structured incident notification to Slack."""
        severity_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵"}.get(severity, "⚪")
        confidence_bar = self._confidence_bar(confidence or 0.0)

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"{severity_emoji} [{severity.upper()}] {title}"}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Service:*\n`{service}`"},
                    {"type": "mrkdwn", "text": f"*Incident ID:*\n`{incident_id}`"},
                ]
            },
        ]

        if root_cause:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Root Cause ({int((confidence or 0) * 100)}% confidence):*\n{root_cause}\n`{confidence_bar}`"
                }
            })

        if github_url:
            blocks.append({
                "type": "actions",
                "elements": [
                    {"type": "button", "text": {"type": "plain_text", "text": "View GitHub Issue"}, "url": github_url},
                ]
            })

        blocks.append({
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": "🤖 Investigated and reported by *Morpheus SRE Agent*"}]
        })

        return await self._send({"blocks": blocks})

    async def post_resolution(
        self,
        incident_id: str,
        title: str,
        mttr_seconds: int,
        root_cause: str,
    ) -> bool:
        """Post a resolution notification."""
        m, s = divmod(mttr_seconds, 60)
        text = f"✅ *RESOLVED* — {title}\n*MTTR:* {m}m {s}s | *Root Cause:* {root_cause}\n🤖 Resolved by Morpheus SRE Agent"
        return await self._send({"text": text})

    async def _send(self, payload: dict) -> bool:
        if not self.webhook_url:
            logger.info("Slack not configured — skipping notification")
            logger.info("Would have sent: %s", payload)
            return False

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(self.webhook_url, json=payload, timeout=10)
                resp.raise_for_status()
                return True
            except httpx.HTTPError as e:
                logger.error("Slack notification failed: %s", e)
                return False

    def _confidence_bar(self, confidence: float) -> str:
        filled = round(confidence * 10)
        return "█" * filled + "░" * (10 - filled)
