test_entity = {
    # Тип операции (для поиска совпадений)
    "transaction_type": "transfer",
    # Сумма транзакции в рублях (для проверки порогов)
    "amount": 5000,
    # Категории трат (для проверки whitelist/blacklist)
    "categories": ["groceries", "utilities"],
    # Подтверждение 2FA (критический фильтр)
    "is_verified": False,
}
