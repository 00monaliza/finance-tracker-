import networkx as nx

from models import Store, Category, Month


def create_graph():
    """
    Создаёт граф знаний для финансового трекера.

    Узлы трёх типов:
      • store     — магазин / сервис (место транзакции)
      • category  — категория расходов
      • month     — месяц (для временной привязки)

    Связи:
      • store  --(относится к)--> category
      • store  --(активен в)----> month
    """
    G = nx.Graph()

    stores = [
        Store(name="Magnum",    categories=["Продукты"],          avg_check=8500),
        Store(name="Glovo",     categories=["Доставка", "Еда"],   avg_check=4200),
        Store(name="Starbucks", categories=["Кофе", "Еда"],       avg_check=2800),
        Store(name="Uber",      categories=["Такси"],             avg_check=1500),
        Store(name="KFC",       categories=["Фастфуд", "Еда"],   avg_check=3200),
        Store(name="Kaspi",     categories=["Переводы"],          avg_check=15000),
        Store(name="Wolt",      categories=["Доставка", "Еда"],   avg_check=5500),
    ]

    categories = [
        Category(name="Продукты",  budget_limit=80000),
        Category(name="Доставка",  budget_limit=30000),
        Category(name="Еда",       budget_limit=50000),
        Category(name="Кофе",      budget_limit=15000),
        Category(name="Такси",     budget_limit=25000),
        Category(name="Фастфуд",   budget_limit=20000),
        Category(name="Переводы",  budget_limit=200000),
    ]

    months = [
        Month(name="Январь",  total_spent=125000),
        Month(name="Февраль", total_spent=98000),
        Month(name="Март",    total_spent=110000),
    ]


    for s in stores:
        G.add_node(s.name, type="store", avg_check=s.avg_check, label=str(s))

    for c in categories:
        G.add_node(c.name, type="category", budget_limit=c.budget_limit, label=str(c))

    for m in months:
        G.add_node(m.name, type="month", total_spent=m.total_spent, label=str(m))


    store_category_edges = [
        ("Magnum",    "Продукты"),
        ("Glovo",     "Доставка"),
        ("Glovo",     "Еда"),
        ("Starbucks", "Кофе"),
        ("Starbucks", "Еда"),
        ("Uber",      "Такси"),
        ("KFC",       "Фастфуд"),
        ("KFC",       "Еда"),
        ("Kaspi",     "Переводы"),
        ("Wolt",      "Доставка"),
        ("Wolt",      "Еда"),
    ]
    G.add_edges_from(store_category_edges, relation="относится к")

    store_month_edges = [
        ("Magnum",    "Январь"),
        ("Magnum",    "Февраль"),
        ("Magnum",    "Март"),
        ("Glovo",     "Январь"),
        ("Glovo",     "Март"),
        ("Starbucks", "Февраль"),
        ("Starbucks", "Март"),
        ("Uber",      "Январь"),
        ("Uber",      "Февраль"),
        ("KFC",       "Февраль"),
        ("Kaspi",     "Январь"),
        ("Kaspi",     "Февраль"),
        ("Kaspi",     "Март"),
        ("Wolt",      "Март"),
    ]
    G.add_edges_from(store_month_edges, relation="активен в")

    return G


def find_related_entities(graph, start_node):
    """
    Универсальный поиск: найти все объекты, связанные с start_node.
    Возвращает список словарей с информацией о соседях.
    """
    if start_node not in graph:
        return []

    neighbors = list(graph.neighbors(start_node))
    result = []
    for n in neighbors:
        node_data = graph.nodes[n]
        edge_data = graph.edges[start_node, n]
        result.append({
            "name": n,
            "type": node_data.get("type", "unknown"),
            "relation": edge_data.get("relation", "—"),
        })
    return result


def classify_transaction(graph, store_name):
    """
    Автоматическая классификация: по названию магазина определяет категорию.
    «Если транзакция от Starbucks → категория Кофе/Еда»
    """
    if store_name not in graph:
        return []

    categories = []
    for neighbor in graph.neighbors(store_name):
        if graph.nodes[neighbor].get("type") == "category":
            categories.append(neighbor)
    return categories
