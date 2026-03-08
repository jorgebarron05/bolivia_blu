import streamlit as st
import requests
from datetime import datetime, timedelta
import pandas as pd
import plotly.graph_objects as go

st.set_page_config(
    page_title="Boliviano vs Dólar Blue",
    page_icon="💱",
    layout="centered"
)

# ── Language toggle ──────────────────────────────────────────────────────────

STRINGS = {
    "ES": {
        "title": "💱 Boliviano vs Dólar Blue",
        "caption": "Tipo de cambio oficial vs mercado paralelo",
        "currency_label": "Moneda de origen",
        "direction_label": "Dirección",
        "to_bob": "→ BOB",
        "from_bob": "← BOB",
        "amount_label": "Cantidad",
        "blue_rate_label": "Tipo de cambio blue (USD → BOB)",
        "official_rate_info": "Tipo de cambio oficial",
        "last_updated": "Actualizado",
        "results_header": "📊 Resultados",
        "official_value": "Valor oficial",
        "blue_value": "Valor blue",
        "more_blue": "Con dólar blue, recibes **{diff} más** que con el tipo de cambio oficial.",
        "less_blue": "Con dólar blue, recibes **{diff} menos** que con el tipo de cambio oficial.",
        "equal": "El tipo de cambio blue y oficial son iguales. Sin diferencia.",
        "bulk_header": "📋 Tabla de conversión",
        "bulk_amount": "Monto",
        "chart_header": "📈 Historial de tipos de cambio",
        "chart_days": "Período",
        "official_label": "Oficial",
        "blue_label": "Blue",
        "loading": "Cargando datos...",
        "error_rate": "No se pudo obtener el tipo de cambio oficial. Usando valor predeterminado.",
        "footer": "Tipo de cambio oficial vía fawazahmed0/exchange-api · Tipo de cambio blue es referencial.",
        "lang_toggle": "English",
    },
    "EN": {
        "title": "💱 Boliviano vs Blue Dollar",
        "caption": "Official exchange rate vs parallel market",
        "currency_label": "Source currency",
        "direction_label": "Direction",
        "to_bob": "→ BOB",
        "from_bob": "← BOB",
        "amount_label": "Amount",
        "blue_rate_label": "Blue rate (USD → BOB)",
        "official_rate_info": "Official exchange rate",
        "last_updated": "Updated",
        "results_header": "📊 Results",
        "official_value": "Official value",
        "blue_value": "Blue value",
        "more_blue": "With the blue rate, you get **{diff} more** than the official rate.",
        "less_blue": "With the blue rate, you get **{diff} less** than the official rate.",
        "equal": "The blue and official rates are equal. No difference.",
        "bulk_header": "📋 Conversion table",
        "bulk_amount": "Amount",
        "chart_header": "📈 Exchange rate history",
        "chart_days": "Period",
        "official_label": "Official",
        "blue_label": "Blue",
        "loading": "Loading data...",
        "error_rate": "Could not fetch official rate. Using default value.",
        "footer": "Official rate via fawazahmed0/exchange-api · Blue rate is indicative only.",
        "lang_toggle": "Español",
    },
}

if "lang" not in st.session_state:
    st.session_state.lang = "ES"

top_left, top_right = st.columns([5, 1])
with top_right:
    if st.button(STRINGS[st.session_state.lang]["lang_toggle"]):
        st.session_state.lang = "EN" if st.session_state.lang == "ES" else "ES"
        st.rerun()

T = STRINGS[st.session_state.lang]

with top_left:
    st.title(T["title"])
    st.caption(T["caption"])

st.divider()

# ── Data fetching ────────────────────────────────────────────────────────────

BASE_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{base}.json"
FALLBACK_API = "https://{date}.currency-api.pages.dev/v1/currencies/{base}.json"

SUPPORTED_CURRENCIES = ["usd", "eur", "gbp"]
CURRENCY_LABELS = {"usd": "USD", "eur": "EUR", "gbp": "GBP"}


@st.cache_data(ttl=3600)
def get_rate(base: str, date: str = "latest") -> float:
    """Fetch exchange rate for base→BOB from fawazahmed0 API."""
    for url_tpl in [BASE_API, FALLBACK_API]:
        try:
            url = url_tpl.format(date=date, base=base.lower())
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            data = r.json()
            return float(data[base.lower()]["bob"])
        except Exception:
            continue
    return None




@st.cache_data(ttl=86400)
def get_historical_rates(base: str, days: int = 30) -> pd.DataFrame:
    """Fetch historical daily rates for base→BOB."""
    records = []
    today = datetime.utcnow().date()
    for i in range(days, 0, -1):
        date = today - timedelta(days=i)
        rate = get_rate(base, date.strftime("%Y-%m-%d"))
        if rate:
            records.append({"date": date, "rate": rate})
    return pd.DataFrame(records)


# ── Controls ─────────────────────────────────────────────────────────────────

col1, col2, col3 = st.columns(3)

with col1:
    currency = st.selectbox(
        T["currency_label"],
        options=SUPPORTED_CURRENCIES,
        format_func=lambda x: CURRENCY_LABELS[x],
    )

with col2:
    direction = st.radio(
        T["direction_label"],
        options=["to_bob", "from_bob"],
        format_func=lambda x: T[x],
        horizontal=True,
    )

with col3:
    amount = st.number_input(
        T["amount_label"],
        min_value=0.0,
        value=100.0,
        step=10.0,
        format="%.2f",
    )

# ── Fetch rates ───────────────────────────────────────────────────────────────

with st.spinner(T["loading"]):
    official_rate = get_rate(currency)

if official_rate is None:
    st.warning(T["error_rate"])
    official_rate = 6.96 if currency == "usd" else 7.50

st.metric(T["official_rate_info"], f"{official_rate:,.4f} BOB")

blue_rate = st.number_input(
    T["blue_rate_label"],
    min_value=0.0,
    value=9.00,
    step=0.10,
    format="%.2f",
)

st.divider()

# ── Results ───────────────────────────────────────────────────────────────────

st.subheader(T["results_header"])

if direction == "to_bob":
    official_out = amount * official_rate
    blue_out = amount * blue_rate
    out_unit = "BOB"
else:
    official_out = amount / official_rate if official_rate else 0
    blue_out = amount / blue_rate if blue_rate else 0
    out_unit = CURRENCY_LABELS[currency]

difference = blue_out - official_out

res_col1, res_col2 = st.columns(2)
with res_col1:
    st.metric(
        T["official_value"],
        f"{official_out:,.2f} {out_unit}",
        delta=f"@ {official_rate:,.4f}",
    )
with res_col2:
    st.metric(
        T["blue_value"],
        f"{blue_out:,.2f} {out_unit}",
        delta=f"{difference:+,.2f} {out_unit}",
        delta_color="normal",
    )

if abs(difference) < 0.001:
    st.info(T["equal"])
elif difference > 0:
    st.success(T["more_blue"].format(diff=f"{difference:,.2f} {out_unit}"))
else:
    st.error(T["less_blue"].format(diff=f"{abs(difference):,.2f} {out_unit}"))

st.divider()

# ── Bulk conversion table ─────────────────────────────────────────────────────

st.subheader(T["bulk_header"])

bulk_amounts = [1, 5, 10, 20, 50, 100, 200, 500, 1000]
if direction == "to_bob":
    rows = [
        {
            T["bulk_amount"]: f"{a:,} {CURRENCY_LABELS[currency]}",
            T["official_label"]: f"{a * official_rate:,.2f} BOB",
            T["blue_label"]: f"{a * blue_rate:,.2f} BOB",
        }
        for a in bulk_amounts
    ]
else:
    rows = [
        {
            T["bulk_amount"]: f"{a:,} BOB",
            T["official_label"]: f"{a / official_rate:,.2f} {CURRENCY_LABELS[currency]}" if official_rate else "—",
            T["blue_label"]: f"{a / blue_rate:,.2f} {CURRENCY_LABELS[currency]}" if blue_rate else "—",
        }
        for a in bulk_amounts
    ]

st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

st.divider()

# ── Historical chart ──────────────────────────────────────────────────────────

st.subheader(T["chart_header"])

days_option = st.radio(
    T["chart_days"],
    options=[30, 90, 180],
    format_func=lambda x: f"{x}d",
    horizontal=True,
)

with st.spinner(T["loading"]):
    hist_df = get_historical_rates(currency, days_option)

if not hist_df.empty:
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=hist_df["date"],
        y=hist_df["rate"],
        mode="lines",
        name=T["official_label"],
        line=dict(color="#1f77b4", width=2),
    ))
    fig.add_hline(
        y=blue_rate,
        line_dash="dot",
        line_color="#ff7f0e",
        annotation_text=T["blue_label"],
        annotation_position="bottom right",
    )
    fig.update_layout(
        margin=dict(l=0, r=0, t=10, b=0),
        xaxis_title=None,
        yaxis_title="BOB",
        legend=dict(orientation="h", y=1.1),
        height=300,
    )
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info(T["loading"])

st.divider()
st.caption(T["footer"])
