import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PRO_MODEL = "gemini-2.5-flash"
FLASH_MODEL = "gemini-2.5-flash"


def get_client():
    return client


def get_model_name(use_pro: bool = True) -> str:
    return PRO_MODEL if use_pro else FLASH_MODEL
