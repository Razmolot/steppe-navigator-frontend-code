import json
from typing import Literal
from openai import OpenAI

client = OpenAI()  # берёт ключ из окружения (OPENAI_API_KEY)

TRANSLATION_SYSTEM_PROMPT = (
    "You are a precise multilingual translator for a career guidance system. "
    "You receive short texts in English, Russian, Kazakh, or a mix of these. "
    "Your task is to translate the text into the target language specified by the user.\n\n"
    "Rules:\n"
    "- Supported target languages: 'en' (English), 'ru' (Russian), 'kk' (Kazakh).\n"
    "- First, detect the source language automatically.\n"
    "- Translate the text into the target language while preserving meaning, tone and nuances.\n"
    "- Do NOT add explanations or extra details.\n"
    "- If there are grammar or spelling mistakes, silently correct them in the translation.\n"
    "- If the text is already in the target language, keep it but you may lightly improve clarity and correctness.\n"
    "- Output ONLY a JSON object of the form:\n"
    "  {\"translation\": \"...\"}\n"
    "- Do not include any other fields or comments."
)


def translate_text(
    text: str,
    target_lang: Literal["en", "ru", "kk"],
    model: str = "gpt-4o-mini",  # или "o4-mini", "gpt-5.1-mini" и т.п.
) -> str:
    """
    Универсальный переводчик:
    - EN → RU/KK
    - RU/KK → EN
    - EN ↔ RU, EN ↔ KK, RU ↔ KK
    Автоматически определяет язык исходного текста.

    :param text: Исходный текст (EN/RU/KK/смешанный).
    :param target_lang: 'en' | 'ru' | 'kk'.
    :param model: Модель для перевода (дешёвая mini-модель — ок).
    :return: Строка-перевод.
    """
    if not text or not text.strip():
        return ""

    if target_lang not in ("en", "ru", "kk"):
        raise ValueError("target_lang must be one of: 'en', 'ru', 'kk'")

    user_payload = {
        "target_lang": target_lang,
        "text": text,
    }

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,  # максимум точности, минимум креатива
    )

    content = response.choices[0].message.content

    try:
        data = json.loads(content)
        translation = data.get("translation", "").strip()
    except json.JSONDecodeError:
        # Fallback: если вдруг невалидный JSON — отдаём сырое содержимое
        translation = content.strip()

    return translation
