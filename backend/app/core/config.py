from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # API Keys (sirf yeh 2 chahiye)
    GROQ_API_KEY: str = ""
    FIRECRAWL_API_KEY: str = ""

    # App defaults (change mat karo)
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    MAX_PAGES: int = 500
    SCREENSHOT_TIMEOUT: int = 30000
    CRAWL_CONCURRENCY: int = 5
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
