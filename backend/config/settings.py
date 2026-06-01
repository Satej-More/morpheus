from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Morpheus SRE Agent"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # Google / Gemini
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    google_cloud_project: str = ""
    google_cloud_location: str = "europe-west1"

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "morpheus"

    # Dynatrace
    dynatrace_api_url: str = ""        # https://{env}.live.dynatrace.com
    dynatrace_api_token: str = ""

    # GitHub
    github_token: str = ""
    github_repo: str = ""              # org/repo

    # Slack
    slack_webhook_url: str = ""
    slack_channel: str = "#incidents"

    # Agent
    poll_interval_seconds: int = 60
    confidence_threshold: float = 0.70
    max_reasoning_steps: int = 10
    mttr_target_seconds: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
