from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Jarvis"
    GROQ_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
