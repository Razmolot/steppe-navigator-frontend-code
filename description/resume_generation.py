import json
from pathlib import Path
from openai import OpenAI

client = OpenAI()


def load_ai_resume_prompt_config(path: str | Path) -> dict:
    """Load report_resume_prompt.json with system_prompt and few_shots."""
    path = Path(path)
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_ai_resume_messages(prompt_config: dict, student_profile: dict) -> list[dict]:
    """
    Build the messages array for the Responses API from:
    - system_prompt
    - few_shots
    - current student_profile (as JSON)
    """
    messages: list[dict] = []

    # 1) system
    messages.append({
        "role": "system",
        "content": prompt_config["system_prompt"]
    })

    # 2) few-shot примеры (если есть)
    for shot in prompt_config.get("few_shots", []):
        messages.append({
            "role": "user",
            "content": json.dumps(shot["user"], ensure_ascii=False)
        })
        messages.append({
            "role": "assistant",
            "content": shot["assistant"]
        })

    # 3) текущий пользовательский запрос
    messages.append({
        "role": "user",
        "content": json.dumps(student_profile, ensure_ascii=False)
    })

    return messages


def extract_text_from_response(response) -> str:
    """
    Аккуратно извлечь текст из ответа Responses API.
    У Responses API контент может быть разбит на части, поэтому проходимся по ним.
    """
    parts: list[str] = []

    # response.output может быть None, если что-то пошло не так
    if not getattr(response, "output", None):
        return ""

    for item in response.output:
        # Каждый item — подобие message с частями
        for content_part in getattr(item, "content", []):
            if getattr(content_part, "type", None) == "output_text":
                parts.append(content_part.text)

    # Склеиваем и триммим
    return "".join(parts).strip()


def generate_ai_resume(
    student_profile: dict,
    prompt_config_path: str | Path,
    model: str = "o4-mini"
) -> str:
    """
    Сгенерировать ИИ-резюме ученика (2 абзаца на английском) на основе:
      - extracurricular activities,
      - RIASEC-триплета,
      - top soft skills (3),
      - top strengths (3),
      - top fields with reasoning (3).

    student_profile ожидается в формате:
    {
      "activities": [...],
      "counselor_comment": " ... ",
      "riasec_code": "IRE",
      "top_soft_skills": [...],
      "top_strengths": [...],
      "top_fields": [
        {"name": "...", "reasoning": "..."},
        ...
      ]
    }

    Возвращает: строку с двумя абзацами на английском.
    """
    prompt_config = load_ai_resume_prompt_config(prompt_config_path)
    messages = build_ai_resume_messages(prompt_config, student_profile)

    response = client.responses.create(
        model=model,
        input=messages
    )

    return extract_text_from_response(response)
