from dataclasses import dataclass, field
from typing import List


@dataclass
class Store:
    """
    Сущность «Магазин/Сервис» — место, где совершается транзакция.

    Attributes:
        name:       Уникальное название магазина или сервиса (id).
        categories: Список категорий расходов, к которым относится магазин.
        avg_check:  Средний чек в тенге (₸).
    """
    name: str
    categories: List[str] = field(default_factory=list)
    avg_check: float = 0.0

    def __str__(self) -> str:
        cats = ", ".join(self.categories) if self.categories else "без категории"
        return f"{self.name} ({cats})"


@dataclass
class Category:
    """
    Сущность «Категория расходов».

    Attributes:
        name:        Название категории (Еда, Такси, Кофе …).
        budget_limit: Лимит бюджета на категорию (₸/месяц).
    """
    name: str
    budget_limit: float = 0.0

    def __str__(self) -> str:
        return f"{self.name} (лимит: {self.budget_limit}₸)"


@dataclass
class Month:
    """
    Сущность «Месяц» — временной узел для агрегации расходов.

    Attributes:
        name:        Название месяца.
        total_spent: Общая сумма расходов за месяц (₸).
    """
    name: str
    total_spent: float = 0.0

    def __str__(self) -> str:
        return f"{self.name} (потрачено: {self.total_spent}₸)"
