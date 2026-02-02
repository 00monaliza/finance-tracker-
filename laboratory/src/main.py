import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import streamlit as st
from mock_data import test_entity as default_data
from logic import check_rules

st.set_page_config(page_title="Rule-Based System Debugger", page_icon="🛠")
st.title("Rule-Based System Debugger 🛠")
st.caption("Лабораторная работа №2: продукционная модель и база знаний")

st.write("### Настройка входящих данных (транзакция)")

# Сайдбар: поля ввода на основе Mock Data
with st.sidebar:
    st.header("Параметры транзакции")
    user_amount = st.number_input(
        "Сумма (₽):",
        min_value=0,
        value=default_data["amount"],
        step=100,
    )
    user_verified = st.checkbox(
        "Транзакция подтверждена (2FA)",
        value=default_data["is_verified"],
    )
    all_categories = list(
        set(
            default_data["categories"]
            + ["gambling", "crypto_speculation", "unlicensed", "subscription"]
        )
    )
    user_categories = st.multiselect(
        "Категории:",
        options=all_categories,
        default=default_data["categories"],
    )
    user_type = st.text_input(
        "Тип операции:",
        value=default_data["transaction_type"],
    )

if st.button("Запустить проверку"):
    current_test_data = {
        "transaction_type": user_type,
        "amount": user_amount,
        "categories": user_categories if user_categories else default_data["categories"],
        "is_verified": user_verified,
    }

    result = check_rules(current_test_data)

    if "✅" in result:
        st.success(result)
    elif "⛔️" in result:
        st.error(result)
    else:
        st.warning(result)

st.sidebar.divider()
st.sidebar.write("Правила загружаются из `data/raw/rules.json`")
