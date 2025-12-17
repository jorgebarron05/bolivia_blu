import streamlit as st
import requests
from bs4 import BeautifulSoup

st.set_page_config(
    page_title="Boliviano vs Dólar Blue",
    page_icon="💱",
    layout="centered"
)

st.title("💱 Boliviano a Dolar Blue")
st.caption("Tipo de cambio oficial USD → BOB extraído de Google Finance vs dólar blue")
st.divider()

@st.cache_data(ttl=600)
def get_usd_bob():
    url = "https://www.google.com/finance/quote/USD-BOB"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=3)
        soup = BeautifulSoup(r.text, "html.parser")
        rate_div = soup.find("div", class_="YMlKec fxKbKc")
        if rate_div:
            return float(rate_div.text.replace(",", ""))
        else:
            raise ValueError("Tipo de cambio no encontrado en la página.")
    except Exception as e:
        raise RuntimeError(f"No se pudo obtener el tipo de cambio: {e}")


official_rate = get_usd_bob()
google_finance_url = "https://www.google.com/finance/quote/USD-BOB"

if not official_rate:
    st.warning("No se pudo obtener el tipo de cambio oficial. Se usará 6.96 como valor predeterminado.")
    official_rate = 6.96

st.info(
    f"**Tipo de cambio oficial USD → BOB:** {official_rate:,.2f} Bs  \n"
    f"[Ver en Google Finance]({google_finance_url})"
)

amount_usd = st.number_input(
    "Cantidad en USD",
    min_value=0.0,
    value=100.00,
    step=10.00,
    format="%.2f"
)

blue_rate = st.number_input(
    "Tipo de cambio dólar blue (USD → BOB)",
    min_value=0.0,
    value=9.00,
    step=0.10,
    format="%.2f"
)

official_bob = amount_usd * official_rate
blue_bob = amount_usd * blue_rate
difference_bob = blue_bob - official_bob

st.subheader("📊 Resultados")

st.metric(
    label="Valor oficial",
    value=f"{official_bob:,.2f} Bs",
    delta=f"Tipo de cambio: {official_rate:,.2f}"
)

st.metric(
    label="Valor dólar blue",
    value=f"{blue_bob:,.2f} Bs",
    delta=f"{difference_bob:+,.2f} Bs",
    delta_color="normal"
)

if difference_bob > 0:
    st.success(f"Con dólar blue, recibes **{difference_bob:,.2f} Bs más** que con el tipo de cambio oficial.")
elif difference_bob < 0:
    st.error(f"Con dólar blue, recibes **{-difference_bob:,.2f} Bs menos** que con el tipo de cambio oficial.")
else:
    st.info("El dólar blue y el tipo de cambio oficial son iguales. Sin diferencia.")

st.divider()
st.caption(
    "Tipo de cambio oficial extraído de Google Finance (puede variar ligeramente). "
    "El dólar blue es proporcionado por el usuario y es informal."
)