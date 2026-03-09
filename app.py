import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st

# ── Optional Sentry ────────────────────────────────────────────────────────────
try:
    import sentry_sdk
    _HAS_SENTRY = True
except ImportError:
    _HAS_SENTRY = False

# ── Constants ──────────────────────────────────────────────────────────────────

CACHE_DIR = Path("cache")
CACHE_FILE = CACHE_DIR / "rates.json"

BASE_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{base}.json"
FALLBACK_API = "https://{date}.currency-api.pages.dev/v1/currencies/{base}.json"

SUPPORTED_CURRENCIES = ["usd", "eur", "gbp"]
CURRENCY_LABELS = {"usd": "USD", "eur": "EUR", "gbp": "GBP"}
DEFAULT_RATES = {"usd": 6.96, "eur": 7.80, "gbp": 9.10}
DEFAULT_BLUE_RATE = 9.00


# ── Helpers ────────────────────────────────────────────────────────────────────

def _secret(key: str, default: str = "") -> str:
    try:
        return st.secrets.get(key, default) or os.getenv(key, default) or default
    except Exception:
        return os.getenv(key, default) or default


def _load_cache() -> dict:
    try:
        CACHE_DIR.mkdir(exist_ok=True)
        if CACHE_FILE.exists():
            return json.loads(CACHE_FILE.read_text())
    except Exception:
        pass
    return {}


def _save_cache(data: dict) -> None:
    try:
        CACHE_DIR.mkdir(exist_ok=True)
        CACHE_FILE.write_text(json.dumps(data))
    except Exception:
        pass


# ── Sentry init ────────────────────────────────────────────────────────────────

if _HAS_SENTRY:
    _dsn = _secret("SENTRY_DSN")
    if _dsn:
        sentry_sdk.init(
            dsn=_dsn,
            traces_sample_rate=0.1,
            environment=os.getenv("ENV", "production"),
        )

# ── Page config ────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Boliviano vs Dólar Blue",
    page_icon="💱",
    layout="centered",
)

# ── PWA + Mobile CSS ───────────────────────────────────────────────────────────

st.markdown("""
<link rel="manifest" href="/static/manifest.json">
<meta name="theme-color" content="#0066CC">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">

<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/static/sw.js').catch(function () {});
    });
}
</script>

<style>
/* ── Mobile-first responsive layout ── */
@media (max-width: 640px) {
    /* Stack Streamlit columns on small screens */
    [data-testid="column"] {
        min-width: 100% !important;
        flex: 1 1 100% !important;
    }
    /* Extra spacing between stacked inputs */
    .stSelectbox, .stNumberInput, .stRadio {
        margin-bottom: 0.75rem;
    }
    /* Bigger metric text on mobile */
    [data-testid="metric-container"] {
        font-size: 1.05rem;
    }
}

/* Larger tap targets everywhere */
.stButton > button {
    min-height: 44px;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
}

/* Copy result button */
.copy-btn {
    background: #0066CC;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    margin-top: 4px;
    min-height: 44px;
}
.copy-btn:hover { background: #0052A3; }
.copy-btn:active { background: #003D7A; }
</style>
""", unsafe_allow_html=True)

# ── Language strings ───────────────────────────────────────────────────────────

STRINGS = {
    "ES": {
        "title": "💱 Boliviano vs Dólar Blue",
        "caption": "Tipo de cambio oficial vs mercado paralelo",
        "currency_label": "Moneda de origen",
        "direction_label": "Dirección",
        "to_bob": "→ BOB",
        "from_bob": "← BOB",
        "amount_label": "Cantidad",
        "blue_rate_label": "Tipo de cambio blue (BOB/USD)",
        "official_rate_info": "Tipo de cambio oficial",
        "results_header": "📊 Resultados",
        "official_value": "Valor oficial",
        "blue_value": "Valor blue",
        "more_blue": "Con dólar blue recibes **{diff} más** que con el tipo oficial.",
        "less_blue": "Con dólar blue recibes **{diff} menos** que con el tipo oficial.",
        "equal": "El tipo blue y oficial son iguales. Sin diferencia.",
        "bulk_header": "📋 Tabla de conversión",
        "bulk_amount": "Monto",
        "chart_header": "📈 Historial de tipos de cambio",
        "chart_days": "Período",
        "official_label": "Oficial",
        "blue_label": "Blue",
        "loading": "Cargando datos...",
        "error_rate": "No se pudo obtener el tipo oficial. Usando valor de respaldo.",
        "footer": "Tipo oficial vía fawazahmed0/exchange-api · Tipo blue es referencial.",
        "lang_toggle": "English",
        "alert_header": "🔔 Alerta de tipo de cambio",
        "alert_label": "Notificar cuando blue supere:",
        "alert_triggered": "⚠️ ¡Alerta! El tipo blue ({rate:.2f}) superó tu umbral ({threshold:.2f}).",
        "copy_result": "📋 Copiar resultado",
        "rate_stale": "Dato de hace {minutes} min",
        "refresh_now": "🔄",
        "blue_auto_label": "Blue (auto-actualizado)",
        "blue_auto_error": "Sin API blue configurada. Ingresa manualmente.",
        "share_url_label": "🔗 Compartir conversión",
    },
    "EN": {
        "title": "💱 Boliviano vs Blue Dollar",
        "caption": "Official exchange rate vs parallel market",
        "currency_label": "Source currency",
        "direction_label": "Direction",
        "to_bob": "→ BOB",
        "from_bob": "← BOB",
        "amount_label": "Amount",
        "blue_rate_label": "Blue rate (BOB/USD)",
        "official_rate_info": "Official exchange rate",
        "results_header": "📊 Results",
        "official_value": "Official value",
        "blue_value": "Blue value",
        "more_blue": "With the blue rate you get **{diff} more** than the official rate.",
        "less_blue": "With the blue rate you get **{diff} less** than the official rate.",
        "equal": "The blue and official rates are equal. No difference.",
        "bulk_header": "📋 Conversion table",
        "bulk_amount": "Amount",
        "chart_header": "📈 Exchange rate history",
        "chart_days": "Period",
        "official_label": "Official",
        "blue_label": "Blue",
        "loading": "Loading data...",
        "error_rate": "Could not fetch official rate. Using fallback value.",
        "footer": "Official rate via fawazahmed0/exchange-api · Blue rate is indicative only.",
        "lang_toggle": "Español",
        "alert_header": "🔔 Rate alert",
        "alert_label": "Notify when blue exceeds:",
        "alert_triggered": "⚠️ Alert! Blue rate ({rate:.2f}) exceeded your threshold ({threshold:.2f}).",
        "copy_result": "📋 Copy result",
        "rate_stale": "Data from {minutes} min ago",
        "refresh_now": "🔄",
        "blue_auto_label": "Blue (auto-updated)",
        "blue_auto_error": "No blue API configured. Enter manually.",
        "share_url_label": "🔗 Share conversion",
    },
}

# ── Session state defaults ─────────────────────────────────────────────────────

if "lang" not in st.session_state:
    st.session_state.lang = "ES"

# ── URL query param state ──────────────────────────────────────────────────────

params = st.query_params

def _qp(key: str, default, cast=str):
    try:
        return cast(params[key])
    except (KeyError, ValueError, TypeError):
        return default

_p_currency  = _qp("currency", "usd")
_p_currency  = _p_currency if _p_currency in SUPPORTED_CURRENCIES else "usd"
_p_direction = _qp("direction", "to_bob")
_p_direction = _p_direction if _p_direction in ("to_bob", "from_bob") else "to_bob"
_p_amount    = _qp("amount", 100.0, float)
_p_blue      = _qp("blue", DEFAULT_BLUE_RATE, float)

# ── Data fetching ──────────────────────────────────────────────────────────────

@st.cache_data(ttl=3600, show_spinner=False)
def get_rate(base: str, date: str = "latest"):
    """Fetch base→BOB rate. Returns (rate, iso_timestamp) or (None, None)."""
    for url_tpl in [BASE_API, FALLBACK_API]:
        try:
            url = url_tpl.format(date=date, base=base.lower())
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            data = r.json()
            rate = float(data[base.lower()]["bob"])
            ts = datetime.now(timezone.utc).isoformat()
            # Persist to file as fallback
            file_cache = _load_cache()
            file_cache[f"{base}_{date}"] = {"rate": rate, "ts": ts}
            _save_cache(file_cache)
            return rate, ts
        except Exception:
            continue
    # File cache fallback
    file_cache = _load_cache()
    entry = file_cache.get(f"{base}_{date}")
    if entry:
        return float(entry["rate"]), entry["ts"]
    return None, None


@st.cache_data(ttl=3600, show_spinner=False)
def get_blue_rate_auto(api_url: str, api_key: str = ""):
    """Fetch blue rate from a user-configured API endpoint."""
    if not api_url:
        return None
    try:
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        r = requests.get(api_url, headers=headers, timeout=5)
        r.raise_for_status()
        data = r.json()
        # Walk common response shapes: {"blue": {"sell": ...}}, {"blue": ...}, {"rate": ...}
        for path in [["blue", "sell"], ["blue", "value"], ["blue"], ["rate"], ["value"]]:
            val = data
            for key in path:
                if isinstance(val, dict) and key in val:
                    val = val[key]
                else:
                    val = None
                    break
            if val is not None:
                return float(val)
    except Exception:
        pass
    return None


@st.cache_data(ttl=86400, show_spinner=False)
def get_historical_rates(base: str, days: int = 30) -> pd.DataFrame:
    """Fetch historical daily rates for base→BOB."""
    records = []
    today = datetime.now(timezone.utc).date()
    for i in range(days, 0, -1):
        date = today - timedelta(days=i)
        rate, _ = get_rate(base, date.strftime("%Y-%m-%d"))
        if rate:
            records.append({"date": date, "rate": rate})
    return pd.DataFrame(records)


# ── Language toggle ────────────────────────────────────────────────────────────

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

# ── Controls ───────────────────────────────────────────────────────────────────

col1, col2, col3 = st.columns(3)

with col1:
    currency = st.selectbox(
        T["currency_label"],
        options=SUPPORTED_CURRENCIES,
        format_func=lambda x: CURRENCY_LABELS[x],
        index=SUPPORTED_CURRENCIES.index(_p_currency),
    )

with col2:
    direction = st.radio(
        T["direction_label"],
        options=["to_bob", "from_bob"],
        format_func=lambda x: T[x],
        horizontal=True,
        index=0 if _p_direction == "to_bob" else 1,
    )

with col3:
    amount = st.number_input(
        T["amount_label"],
        min_value=0.0,
        value=_p_amount,
        step=10.0,
        format="%.2f",
    )

# ── Fetch official rate ────────────────────────────────────────────────────────

with st.spinner(T["loading"]):
    official_rate, fetched_ts = get_rate(currency)

if official_rate is None:
    st.warning(T["error_rate"])
    official_rate = DEFAULT_RATES.get(currency, 6.96)
    fetched_ts = None

# Staleness indicator + manual refresh
rate_col, refresh_col = st.columns([5, 1])
with rate_col:
    stale_delta = None
    if fetched_ts:
        age_min = int((datetime.now(timezone.utc) - datetime.fromisoformat(fetched_ts)).total_seconds() / 60)
        if age_min > 0:
            stale_delta = T["rate_stale"].format(minutes=age_min)
    st.metric(T["official_rate_info"], f"{official_rate:,.4f} BOB", delta=stale_delta, delta_color="off")

with refresh_col:
    st.write("")
    if st.button(T["refresh_now"], help="Clear cache and refresh rates"):
        get_rate.clear()
        get_blue_rate_auto.clear()
        get_historical_rates.clear()
        st.rerun()

# ── Blue rate (auto-fetch or manual) ──────────────────────────────────────────

blue_api_url = _secret("BLUE_RATE_API_URL")
blue_api_key = _secret("BLUE_RATE_API_KEY")
auto_blue = get_blue_rate_auto(blue_api_url, blue_api_key)

if auto_blue:
    b_col1, b_col2 = st.columns([3, 1])
    with b_col1:
        blue_rate = st.number_input(
            T["blue_rate_label"],
            min_value=0.0,
            value=auto_blue,
            step=0.10,
            format="%.2f",
        )
    with b_col2:
        st.metric(T["blue_auto_label"], f"{auto_blue:.2f}")
else:
    blue_rate = st.number_input(
        T["blue_rate_label"],
        min_value=0.0,
        value=_p_blue,
        step=0.10,
        format="%.2f",
    )

# ── Sync URL query params ──────────────────────────────────────────────────────

st.query_params.update({
    "currency":  currency,
    "direction": direction,
    "amount":    f"{amount:.2f}",
    "blue":      f"{blue_rate:.2f}",
})

st.divider()

# ── Results ────────────────────────────────────────────────────────────────────

st.subheader(T["results_header"])

if direction == "to_bob":
    official_out = amount * official_rate
    blue_out     = amount * blue_rate
    out_unit     = "BOB"
else:
    official_out = amount / official_rate if official_rate else 0.0
    blue_out     = amount / blue_rate     if blue_rate     else 0.0
    out_unit     = CURRENCY_LABELS[currency]

difference = blue_out - official_out

res_col1, res_col2 = st.columns(2)
with res_col1:
    st.metric(T["official_value"], f"{official_out:,.2f} {out_unit}", delta=f"@ {official_rate:,.4f}")
with res_col2:
    st.metric(T["blue_value"], f"{blue_out:,.2f} {out_unit}", delta=f"{difference:+,.2f} {out_unit}", delta_color="normal")

if abs(difference) < 0.001:
    st.info(T["equal"])
elif difference > 0:
    st.success(T["more_blue"].format(diff=f"{difference:,.2f} {out_unit}"))
else:
    st.error(T["less_blue"].format(diff=f"{abs(difference):,.2f} {out_unit}"))

# ── Copy result + Share URL ────────────────────────────────────────────────────

copy_text = (
    f"{amount:.2f} {CURRENCY_LABELS[currency]} = "
    f"{official_out:,.2f} BOB (oficial) / {blue_out:,.2f} BOB (blue)"
).replace("'", "\\'")

share_url_text = (
    f"?currency={currency}&direction={direction}"
    f"&amount={amount:.2f}&blue={blue_rate:.2f}"
).replace("'", "\\'")

st.markdown(f"""
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
  <button class="copy-btn"
    onclick="navigator.clipboard.writeText('{copy_text}').then(()=>{{
      this.textContent='✅';
      setTimeout(()=>{{this.textContent='{T["copy_result"]}';}},2000);
    }});">{T["copy_result"]}</button>
  <button class="copy-btn" style="background:#555;"
    onclick="navigator.clipboard.writeText(window.location.origin+'{share_url_text}').then(()=>{{
      this.textContent='✅';
      setTimeout(()=>{{this.textContent='{T["share_url_label"]}';}},2000);
    }});">{T["share_url_label"]}</button>
</div>
""", unsafe_allow_html=True)

st.divider()

# ── Rate alert ─────────────────────────────────────────────────────────────────

with st.expander(T["alert_header"]):
    alert_threshold = st.number_input(
        T["alert_label"],
        min_value=0.0,
        value=10.0,
        step=0.25,
        format="%.2f",
    )
    if alert_threshold > 0 and blue_rate >= alert_threshold:
        st.error(T["alert_triggered"].format(rate=blue_rate, threshold=alert_threshold))
        # Request browser notification permission + fire notification
        st.markdown("""
<script>
(function() {
    var msg = "Bolivia Blu: blue rate threshold exceeded!";
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
        new Notification('Bolivia Blu Alert', { body: msg, icon: '/static/icon-192.png' });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(p) {
            if (p === 'granted') new Notification('Bolivia Blu Alert', { body: msg, icon: '/static/icon-192.png' });
        });
    }
})();
</script>
""", unsafe_allow_html=True)

st.divider()

# ── Bulk conversion table ──────────────────────────────────────────────────────

st.subheader(T["bulk_header"])

bulk_amounts = [1, 5, 10, 20, 50, 100, 200, 500, 1000]
if direction == "to_bob":
    rows = [
        {
            T["bulk_amount"]:   f"{a:,} {CURRENCY_LABELS[currency]}",
            T["official_label"]: f"{a * official_rate:,.2f} BOB",
            T["blue_label"]:     f"{a * blue_rate:,.2f} BOB",
        }
        for a in bulk_amounts
    ]
else:
    rows = [
        {
            T["bulk_amount"]:   f"{a:,} BOB",
            T["official_label"]: f"{a / official_rate:,.2f} {CURRENCY_LABELS[currency]}" if official_rate else "—",
            T["blue_label"]:     f"{a / blue_rate:,.2f} {CURRENCY_LABELS[currency]}"     if blue_rate     else "—",
        }
        for a in bulk_amounts
    ]

st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

st.divider()

# ── Historical chart ───────────────────────────────────────────────────────────

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
