
import streamlit as st
from logic import process_text_message

import networkx as nx
import os

def load_graph():
    G = nx.Graph()
    G.add_node("python")
    G.add_node("кашель")
    G.add_node("алматы")
    G.add_edge("python", "программирование")
    G.add_edge("кашель", "простуда")
    G.add_edge("алматы", "казахстан")
    return G

st.title("AI Assistant")

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if user_input := st.chat_input("Введите ваш запрос..."):
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
    graph = load_graph()
    bot_response = process_text_message(user_input, graph)
    st.session_state.messages.append({"role": "assistant", "content": bot_response})
    with st.chat_message("assistant"):
        st.markdown(bot_response)
