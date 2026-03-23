import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from openai import OpenAI

# Инициализация клиента: api_key лучше взять из окружения (OPENAI_API_KEY)
client = OpenAI()  # Если хочешь — можешь явно передать api_key=...


# 1. Загружаем промпт и few-shot из JSON
PROMPT_PATH = Path("prompt_config.json")

with PROMPT_PATH.open("r", encoding="utf-8") as f:
    prompt_config = json.load(f)

SYSTEM_PROMPT: str = prompt_config["system_prompt"]
FEW_SHOTS: List[Dict[str, Any]] = prompt_config["few_shots"]


def build_messages_for_student(
    activities: List[str],
    counselor_comment: str,
    riasec_code: str,
) -> List[Dict[str, str]]:
    """
    Собираем messages для вызова модели:
    - system
    - few-shot user/assistant пары
    - текущий user с данными студента
    """

    messages: List[Dict[str, str]] = []

    # 1) System message
    messages.append({
        "role": "system",
        "content": SYSTEM_PROMPT,
    })

    # 2) Few-shot примеры
    for example in FEW_SHOTS:
        example_user = example["user"]
        example_assistant = example["assistant"]

        # user-пример
        messages.append({
            "role": "user",
            "content": json.dumps(example_user, ensure_ascii=False),
        })
        # assistant-пример
        messages.append({
            "role": "assistant",
            "content": json.dumps(example_assistant, ensure_ascii=False),
        })

    # 3) Текущий студент
    current_user_payload = {
        "activities": activities,
        "counselor_comment": counselor_comment,
        "riasec_code": riasec_code,
    }

    messages.append({
        "role": "user",
        "content": json.dumps(current_user_payload, ensure_ascii=False),
    })

    return messages


def get_top_fields_for_student(
    activities: List[str],
    counselor_comment: str,
    riasec_code: str,
    model: str = "o4-mini",  # или "gpt-5.1-mini"
    temperature: float = 0.3,
) -> Dict[str, Any]:
    """
    Вызывает LLM и возвращает распарсенный JSON с top_fields
    для конкретного школьника.

    Ожидаемый формат ответа модели:
    {
      "top_fields": [
        {
          "id": "IT_AI",
          "name_en": "Information Technology & Artificial Intelligence",
          "score": 0.92,
          "reasoning_en": "..."
        },
        ...
      ]
    }
    """
    messages = build_messages_for_student(
        activities=activities,
        counselor_comment=counselor_comment,
        riasec_code=riasec_code,
    )

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        response_format={"type": "json_object"},  # просим строго JSON
        temperature=temperature,
    )

    raw_content: str = response.choices[0].message.content

    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        # На всякий случай fallback, если модель чуть-чуть накосячила
        print("LLM returned invalid JSON, raw output:")
        print(raw_content)
        raise

    return result


if __name__ == "__main__":
    # Тестовый кейс
    activities = [
        "Robotics",
        "Programming, websites",
        "Video editing, photography",
    ]
    counselor_comment = (
        "Student enjoys building things and solving technical challenges. "
        "Curious and persistent."
    )
    riasec_code = "IRE"

    result = get_top_fields_for_student(
        activities=activities,
        counselor_comment=counselor_comment,
        riasec_code=riasec_code,
    )

    print(json.dumps(result, indent=2, ensure_ascii=False))
