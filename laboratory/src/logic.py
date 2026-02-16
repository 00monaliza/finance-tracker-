def process_text_message(text, data_source):
    """
    Принимает текст пользователя, ищет ключевые слова в базе/графе
    и возвращает ответ.
    """
    text = text.lower()

    if data_source and hasattr(data_source, 'nodes') and text in data_source.nodes:
        neighbors = list(data_source.neighbors(text))
        return f"Я нашел '{text}' в базе! С этим связано: {', '.join(neighbors)}"

    if "привет" in text:
        return "Привет! Я готов помочь. Напиши название объекта."

    return "Я не понимаю. Попробуйте ввести точное название (например, 'Python' или 'Кашель')."
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_PATH = os.path.join(BASE_DIR, "data", "raw", "rules.json")


def load_rules():
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def check_rules(data):
    """
    Принимает словарь данных транзакции (data), возвращает строковый вердикт.
    Все пороги и списки загружаются из rules.json (без хардкода).
    """
    rules = load_rules()
    thresholds = rules["thresholds"]
    lists_config = rules["lists"]
    critical = rules["critical_rules"]

    if critical.get("must_be_verified") and not data.get("is_verified"):
        return "Критическая ошибка: Транзакция не подтверждена (требуется 2FA)"

    amount = data.get("amount", 0)
    min_amount = thresholds.get("min_value", thresholds.get("min_amount", 0))
    max_amount = thresholds.get("max_value", thresholds.get("max_amount", float("inf")))

    if amount < min_amount:
        return "Отказ: Сумма ниже минимального порога"
    if amount > max_amount:
        return "Отказ: Сумма превышает максимальный лимит"

    blacklist = lists_config.get("blacklist", [])
    for category in data.get("categories", []):
        if category in blacklist:
            return f"Предупреждение: Запрещённая категория ({category})"

    scenario_name = rules.get("scenario_name", "сценарий")
    return f"Успех: Транзакция соответствует сценарию «{scenario_name}»"
