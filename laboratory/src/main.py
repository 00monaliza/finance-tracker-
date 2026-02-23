import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import streamlit as st
import networkx as nx
import matplotlib.pyplot as plt
from matplotlib import rcParams

from knowledge_graph import create_graph, find_related_entities, classify_transaction

rcParams["font.family"] = "DejaVu Sans"

st.set_page_config(page_title="Knowledge Graph Explorer", page_icon="🕸", layout="wide")
st.title("Knowledge Graph Explorer 🕸")
st.caption("Лабораторная работа №3: Объектная модель и Графы Знаний")

G = create_graph()

COLOR_MAP = {
    "store":    "#4FC3F7",   # голубой
    "category": "#AED581",   # зелёный
    "month":    "#FFB74D",   # оранжевый
}

with st.sidebar:
    st.header("Навигация")

    mode = st.radio(
        "Режим:",
        ["Поиск связей", "Классификация транзакции"],
    )

    st.divider()
    st.markdown("**Легенда:**")
    st.markdown("Магазин / Сервис")
    st.markdown("Категория расходов")
    st.markdown("Месяц")

col_left, col_right = st.columns([1, 2])

with col_left:
    if mode == "Поиск связей":
        st.write("### Поиск связей узла")
        all_nodes = sorted(G.nodes())
        selected_node = st.selectbox("Выберите объект:", all_nodes)

        if st.button("Найти связи"):
            results = find_related_entities(G, selected_node)
            if results:
                node_type = G.nodes[selected_node].get("type", "")
                st.success(f"Узел «{selected_node}» (тип: {node_type}) имеет {len(results)} связей:")
                for r in results:
                    icon = {"store": "🔵", "category": "🟢", "month": "🟠"}.get(r["type"], "⚪")
                    st.write(f"  {icon} **{r['name']}** — _{r['relation']}_")
            else:
                st.warning("Связей не найдено.")

    else:  # Классификация транзакции
        st.write("### Классификация транзакции")
        stores = sorted([n for n, d in G.nodes(data=True) if d.get("type") == "store"])
        selected_store = st.selectbox("Магазин / сервис:", stores)

        if st.button("Определить категорию"):
            cats = classify_transaction(G, selected_store)
            if cats:
                st.success(
                    f"Транзакция от «{selected_store}» → категория: **{', '.join(cats)}**"
                )
            else:
                st.warning("Категория не определена.")

with col_right:
    st.write("### Визуализация графа знаний")

    node_colors = [
        COLOR_MAP.get(G.nodes[n].get("type", ""), "#E0E0E0")
        for n in G.nodes()
    ]

    fig, ax = plt.subplots(figsize=(10, 7))

    pos = nx.spring_layout(G, seed=42, k=1.8)

    nx.draw_networkx_edges(G, pos, edge_color="#BDBDBD", width=1.5, ax=ax)

    nx.draw_networkx_nodes(
        G, pos,
        node_color=node_colors,
        node_size=2200,
        edgecolors="#555555",
        linewidths=1.2,
        ax=ax,
    )

    # Подписи
    nx.draw_networkx_labels(G, pos, font_size=9, font_weight="bold", ax=ax)

    # Подписи на рёбрах (тип связи)
    edge_labels = nx.get_edge_attributes(G, "relation")
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=7, ax=ax)

    ax.set_title("Граф знаний: Финансовый трекер", fontsize=14)
    ax.axis("off")
    fig.tight_layout()

    st.pyplot(fig)

rows = []
for node, data in G.nodes(data=True):
    rows.append({
        "Узел": node,
        "Тип": data.get("type", "—"),
        "Доп. информация": data.get("label", "—"),
    })
st.dataframe(rows, use_container_width=True)
