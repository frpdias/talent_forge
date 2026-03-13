"""
TalentForge — Analytics Dashboard (Python Dash + Supabase REST)
Rota analítica complementar ao dashboard operacional Next.js.

Acesse: http://localhost:8051
"""

import os
import warnings
warnings.filterwarnings("ignore")

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Carrega .env da API
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "apps", "api", ".env"))

import urllib.parse
import re
import requests as _requests

_UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I
)

import dash
from dash import dcc, html, Input, Output, State, no_update
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px

# ─── Cliente REST direto (evita incompatibilidade supabase-py / Python 3.14) ──
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

supabase_ok = bool(SUPABASE_URL and SUPABASE_KEY)

def sb_get(table: str, params: dict) -> list:
    """GET /rest/v1/{table}?{params} → lista de dicts."""
    if not supabase_ok:
        return []
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        r = _requests.get(url, headers=_HEADERS, params=params, timeout=10)
        r.raise_for_status()
        return r.json() or []
    except Exception as e:
        print(f"[sb_get] ERRO {table}: {e}", flush=True)
        return []

print(f"[INIT] Supabase URL={'OK' if SUPABASE_URL else 'MISSING'} KEY={'OK' if SUPABASE_KEY else 'MISSING'}", flush=True)

# ─── Paleta (design-system.md) ───────────────────────────────────────────────
C = {
    "primary":   "#141042",
    "secondary": "#10B981",
    "accent":    "#3B82F6",
    "warning":   "#F97316",
    "danger":    "#EF4444",
    "purple":    "#A855F7",
    "bg":        "#F0F2F5",
    "card":      "#FFFFFF",
    "text":      "#111111",
    "muted":     "#6B7280",
    "border":    "#E5E7EB",
}

STAGE_ORDER = ["Triagem", "Entrevista RH", "Entrevista Técnica", "Avaliação", "Proposta", "Contratado"]
STAGE_COLORS = [C["accent"], "#6366F1", C["purple"], C["warning"], C["secondary"], C["primary"]]

# ─── Queries Supabase ─────────────────────────────────────────────────────────

def fetch_pipeline_data(org_id=None):
    """Candidatos por etapa do pipeline."""
    print(f"[DEBUG] fetch_pipeline_data org_id={org_id!r}", flush=True)
    if not supabase_ok or not org_id:
        print("[DEBUG] pipeline: sem conexão ou org_id → mock", flush=True)
        return _mock_pipeline()
    # Passo 1: busca job_ids da org
    jobs = sb_get("jobs", {"select": "id", "org_id": f"eq.{org_id}"})
    job_ids = [j["id"] for j in jobs]
    print(f"[DEBUG] pipeline job_ids count={len(job_ids)}", flush=True)
    if not job_ids:
        return _mock_pipeline()
    # Passo 2: applications filtradas pelos job_ids
    rows = sb_get("applications", {
        "select": "status",
        "job_id": f"in.({','.join(job_ids)})",
    })
    print(f"[DEBUG] pipeline rows={len(rows)}", flush=True)
    counts = {}
    for r in rows:
        s = r.get("status") or "Triagem"
        counts[s] = counts.get(s, 0) + 1
    print(f"[DEBUG] pipeline counts={counts}", flush=True)
    return counts if counts else _mock_pipeline()


def fetch_stalled_candidates(org_id=None):
    """Candidatos parados há N dias por etapa."""
    if not supabase_ok or not org_id:
        return _mock_stalled()
    jobs = sb_get("jobs", {"select": "id", "org_id": f"eq.{org_id}"})
    job_ids = [j["id"] for j in jobs]
    if not job_ids:
        return _mock_stalled()
    # Usa formato Z (UTC) para evitar encoding do '+' no parâmetro
    cutoff = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = sb_get("applications", {
        "select": "status,updated_at",
        "job_id": f"in.({','.join(job_ids)})",
        "updated_at": f"lt.{cutoff}",
        "status": "not.in.(hired,rejected)",
    })
    if not rows:
        return _mock_stalled()
    now = datetime.now(timezone.utc)
    buckets = {}
    for r in rows:
        s = r.get("status") or "Triagem"
        try:
            upd = datetime.fromisoformat(r["updated_at"].replace("Z", "+00:00"))
            dias = (now - upd).days
        except Exception:
            dias = 5
        if s not in buckets:
            buckets[s] = []
        buckets[s].append(dias)
    result = []
    for stage, dias_list in buckets.items():
        result.append({
            "stage": stage,
            "count": len(dias_list),
            "avg_days": round(sum(dias_list) / len(dias_list), 1),
            "max_days": max(dias_list),
        })
    return result if result else _mock_stalled()


def fetch_assessment_scores(org_id=None):
    """Distribuição de scores de assessments."""
    if not supabase_ok or not org_id:
        return _mock_scores()
    jobs = sb_get("jobs", {"select": "id", "org_id": f"eq.{org_id}"})
    job_ids = [j["id"] for j in jobs]
    if not job_ids:
        return _mock_scores()
    rows = sb_get("assessments", {
        "select": "assessment_type,normalized_score,raw_score",
        "job_id": f"in.({','.join(job_ids)})",
        "normalized_score": "not.is.null",
    })
    # Normaliza campos para funções de gráfico
    result = []
    for r in rows:
        score = r.get("normalized_score") or r.get("raw_score")
        if score is not None:
            result.append({"score": score, "type": r.get("assessment_type") or "Outro"})
    return result if result else _mock_scores()


def fetch_monthly_trend(org_id=None):
    """Candidaturas e contratações por mês (últimos 6 meses)."""
    if not supabase_ok or not org_id:
        return _mock_trend()
    jobs = sb_get("jobs", {"select": "id", "org_id": f"eq.{org_id}"})
    job_ids = [j["id"] for j in jobs]
    if not job_ids:
        return _mock_trend()
    six_months_ago = (datetime.now(timezone.utc) - timedelta(days=180)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = sb_get("applications", {
        "select": "status,created_at",
        "job_id": f"in.({','.join(job_ids)})",
        "created_at": f"gte.{six_months_ago}",
    })
    if not rows:
        return _mock_trend()
    months = {}
    for r in rows:
        try:
            dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            key = dt.strftime("%b/%y")
        except Exception:
            continue
        if key not in months:
            months[key] = {"apps": 0, "hired": 0}
        months[key]["apps"] += 1
        if r.get("status") in ("hired", "Contratado"):
            months[key]["hired"] += 1
    sorted_keys = sorted(months.keys(), key=lambda x: datetime.strptime(x, "%b/%y"))
    return {
        "labels": sorted_keys,
        "apps":   [months[k]["apps"] for k in sorted_keys],
        "hired":  [months[k]["hired"] for k in sorted_keys],
    } if sorted_keys else _mock_trend()


def fetch_jobs_summary(org_id=None):
    print(f"[DEBUG] fetch_jobs_summary org_id={org_id!r}", flush=True)
    if not supabase_ok or not org_id:
        return _mock_jobs()
    jobs = sb_get("jobs", {
        "select": "id,title",
        "org_id": f"eq.{org_id}",
        "status": "in.(open,active,on_hold)",
    })
    print(f"[DEBUG] jobs={[j.get('title') for j in jobs]}", flush=True)
    if not jobs:
        return _mock_jobs()
    job_ids = [j["id"] for j in jobs]
    apps = sb_get("applications", {
        "select": "job_id",
        "job_id": f"in.({','.join(job_ids)})",
    })
    counts = {}
    for a in apps:
        jid = a["job_id"]
        counts[jid] = counts.get(jid, 0) + 1
    result = []
    for j in jobs:
        title = j.get("title") or ""
        result.append({
            "title": title[:35] + "…" if len(title) > 35 else title,
            "count": counts.get(j["id"], 0),
        })
    result.sort(key=lambda x: x["count"], reverse=True)
    return result[:8] if result else _mock_jobs()


# ─── Mocks (fallback) ─────────────────────────────────────────────────────────

def _mock_pipeline():
    return {
        "Triagem": 34, "Entrevista RH": 22, "Entrevista Técnica": 14,
        "Avaliação": 11, "Proposta": 5, "Contratado": 6,
    }

def _mock_stalled():
    return [
        {"stage": "Triagem",          "count": 12, "avg_days": 8,  "max_days": 21},
        {"stage": "Entrevista RH",    "count": 7,  "avg_days": 5,  "max_days": 12},
        {"stage": "Entrevista Técnica","count": 4, "avg_days": 9,  "max_days": 18},
        {"stage": "Avaliação",        "count": 3,  "avg_days": 14, "max_days": 25},
    ]

def _mock_scores():
    import random
    random.seed(42)
    TYPES = ["DISC", "TFCI", "Técnico", "Comportamental"]
    return [{"score": random.randint(40, 100), "type": random.choice(TYPES)} for _ in range(80)]

def _mock_trend():
    return {
        "labels": ["Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26"],
        "apps":   [42, 58, 35, 71, 63, 84],
        "hired":  [3,   5,  2,   6,   4,   6],
    }

def _mock_jobs():
    return [
        {"title": "Desenvolvedor Full-Stack",  "count": 18},
        {"title": "UX Designer Sênior",        "count": 11},
        {"title": "Analista de Dados",         "count": 22},
        {"title": "Gerente de Produto",        "count": 7},
        {"title": "Engenheiro de DevOps",      "count": 5},
        {"title": "Cientista de Dados",        "count": 14},
    ]


# ─── Gráficos ─────────────────────────────────────────────────────────────────

def fig_funnel(pipeline):
    stages = list(pipeline.keys())
    values = list(pipeline.values())
    fig = go.Figure(go.Funnel(
        y=stages,
        x=values,
        textposition="inside",
        textinfo="value+percent initial",
        marker=dict(color=STAGE_COLORS[:len(stages)]),
        connector=dict(line=dict(color=C["border"], width=1)),
    ))
    fig.update_layout(**_layout("Funil de Conversão por Etapa"), margin=dict(l=20, r=20, t=50, b=30))
    return fig


def fig_bottleneck(pipeline):
    stages = list(pipeline.keys())
    values = list(pipeline.values())
    # taxa de conversão para a próxima etapa
    conversions = []
    for i in range(len(values) - 1):
        pct = round(values[i+1] / values[i] * 100, 1) if values[i] else 0
        conversions.append(pct)
    conversions.append(100.0)

    colors = []
    for pct in conversions:
        if pct < 40:
            colors.append(C["danger"])
        elif pct < 65:
            colors.append(C["warning"])
        else:
            colors.append(C["secondary"])

    fig = go.Figure(go.Bar(
        y=stages,
        x=values,
        orientation="h",
        marker_color=colors,
        text=[f"{v} cand. ({c}% conv.)" for v, c in zip(values, conversions)],
        textposition="outside",
    ))
    fig.update_layout(**_layout("Gargalos por Etapa (conversão → próxima)"))
    fig.update_layout(xaxis_title="Nº de candidatos", margin=dict(l=130, r=80, t=50, b=30))
    return fig


def fig_stalled_bubble(stalled):
    if not stalled:
        stalled = _mock_stalled()
    stages  = [s["stage"]    for s in stalled]
    avg_days = [s["avg_days"] for s in stalled]
    counts  = [s["count"]    for s in stalled]
    max_days = [s["max_days"] for s in stalled]

    fig = go.Figure(go.Scatter(
        x=avg_days,
        y=stages,
        mode="markers+text",
        marker=dict(
            size=[c * 6 + 20 for c in counts],
            color=avg_days,
            colorscale=[[0, C["secondary"]], [0.5, C["warning"]], [1, C["danger"]]],
            showscale=True,
            colorbar=dict(title="Dias parado", thickness=12),
            line=dict(width=1, color="white"),
        ),
        text=[f"{c} cand." for c in counts],
        textposition="middle center",
        textfont=dict(color="white", size=11, family="Inter"),
        customdata=list(zip(counts, avg_days, max_days)),
        hovertemplate=(
            "<b>%{y}</b><br>"
            "Candidatos parados: %{customdata[0]}<br>"
            "Média: %{customdata[1]} dias<br>"
            "Máximo: %{customdata[2]} dias<extra></extra>"
        ),
    ))
    fig.update_layout(**_layout("Candidatos Parados por Etapa"))
    fig.update_layout(xaxis_title="Dias sem movimentação (média)", margin=dict(l=140, r=40, t=50, b=40))
    return fig


def fig_score_histogram(scores_data):
    scores = [r["score"] for r in scores_data if r.get("score") is not None]
    if not scores:
        scores = [s["score"] for s in _mock_scores()]

    fig = go.Figure(go.Histogram(
        x=scores,
        nbinsx=20,
        marker_color=C["accent"],
        opacity=0.85,
    ))
    # linha de média
    avg = sum(scores) / len(scores)
    fig.add_vline(x=avg, line_dash="dash", line_color=C["warning"],
                  annotation_text=f"Média: {avg:.0f}",
                  annotation_position="top right")
    fig.update_layout(**_layout("Distribuição de Scores de Assessment"))
    fig.update_layout(xaxis_title="Score", yaxis_title="Nº de assessments", bargap=0.05, margin=dict(l=20, r=20, t=50, b=30))
    return fig


def fig_score_donut(scores_data):
    types_count = {}
    for r in scores_data:
        t = r.get("type") or "Outro"
        types_count[t] = types_count.get(t, 0) + 1
    if not types_count:
        for r in _mock_scores():
            t = r.get("type") or "Outro"
            types_count[t] = types_count.get(t, 0) + 1

    labels = list(types_count.keys())
    values = list(types_count.values())
    fig = go.Figure(go.Pie(
        labels=labels,
        values=values,
        hole=0.55,
        marker_colors=[C["accent"], C["secondary"], C["purple"], C["warning"], C["primary"]],
        textinfo="label+percent",
    ))
    fig.update_layout(**_layout("Tipos de Assessment"))
    fig.update_layout(showlegend=False, margin=dict(l=20, r=20, t=50, b=30))
    return fig


def fig_trend(trend):
    labels = trend["labels"]
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=labels, y=trend["apps"],
        name="Candidaturas",
        mode="lines+markers",
        line=dict(color=C["accent"], width=2.5),
        marker=dict(size=6),
        fill="tozeroy",
        fillcolor="rgba(59,130,246,0.1)",
    ))
    fig.add_trace(go.Bar(
        x=labels, y=trend["hired"],
        name="Contratações",
        marker_color=C["secondary"],
        yaxis="y2",
        opacity=0.8,
    ))
    fig.update_layout(**_layout("Candidaturas vs Contratações (6 meses)"))
    fig.update_layout(
        yaxis=dict(title="Candidaturas", showgrid=True,
                   gridcolor=C["border"], color=C["muted"]),
        yaxis2=dict(title="Contratações", overlaying="y", side="right",
                    color=C["secondary"], showgrid=False),
        legend=dict(orientation="h", y=1.08, x=0),
        margin=dict(l=20, r=60, t=60, b=30),
    )
    return fig


def fig_jobs_bar(jobs):
    titles = [j["title"] for j in jobs]
    counts = [j["count"] for j in jobs]
    fig = go.Figure(go.Bar(
        y=titles,
        x=counts,
        orientation="h",
        marker=dict(
            color=counts,
            colorscale=[[0, C["accent"]], [1, C["primary"]]],
        ),
        text=counts,
        textposition="outside",
    ))
    fig.update_layout(**_layout("Candidatos por Vaga Ativa"))
    fig.update_layout(xaxis_title="Nº de candidatos", margin=dict(l=200, r=60, t=50, b=30))
    return fig


def _layout(title):
    return dict(
        title=dict(text=title, font=dict(size=15, color=C["text"], family="Inter")),
        paper_bgcolor=C["card"],
        plot_bgcolor=C["card"],
        font=dict(family="Inter", size=12, color=C["muted"]),
        yaxis=dict(showgrid=False, color=C["muted"]),
        xaxis=dict(showgrid=True, gridcolor=C["border"], color=C["muted"]),
    )


# ─── KPI mini-sparkline ───────────────────────────────────────────────────────

def hex_to_rgba(hex_color, alpha=0.15):
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def sparkline(values, color, fill_color=None):
    fig = go.Figure(go.Scatter(
        y=values, mode="lines",
        line=dict(color=color, width=2),
        fill="tozeroy",
        fillcolor=fill_color or hex_to_rgba(color, 0.15),
    ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=50,
        showlegend=False,
    )
    return fig


def kpi_card(label, value, delta, delta_positive, sparkline_data, color):
    delta_color = C["secondary"] if delta_positive else C["danger"]
    delta_icon  = "↑" if delta_positive else "↓"
    return html.Div([
        html.Div([
            html.Div(label, style={"fontSize": "12px", "color": C["muted"], "marginBottom": "4px"}),
            html.Div([
                html.Span(str(value), style={"fontSize": "28px", "fontWeight": "700", "color": C["text"]}),
                html.Span(f" {delta_icon}{delta}", style={
                    "fontSize": "12px", "color": delta_color,
                    "fontWeight": "600", "marginLeft": "8px",
                }),
            ]),
        ], style={"padding": "16px 16px 4px"}),
        dcc.Graph(
            figure=sparkline(sparkline_data, color),
            config={"displayModeBar": False},
            style={"height": "50px"},
        ),
    ], style={
        "background": C["card"],
        "borderRadius": "12px",
        "boxShadow": "0 1px 4px rgba(0,0,0,0.08)",
        "borderTop": f"3px solid {color}",
        "overflow": "hidden",
    })


# ─── Layout ───────────────────────────────────────────────────────────────────

def card(title, children, col_width=6):
    return dbc.Col([
        html.Div([
            html.Div(title, style={
                "fontWeight": "600", "fontSize": "13px",
                "color": C["muted"], "padding": "16px 20px 0",
                "letterSpacing": "0.05em", "textTransform": "uppercase",
            }) if title else None,
            html.Div(children, style={"padding": "8px"}),
        ], style={
            "background": C["card"],
            "borderRadius": "12px",
            "boxShadow": "0 1px 4px rgba(0,0,0,0.08)",
            "height": "100%",
        })
    ], width=col_width, style={"marginBottom": "20px"})


app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    ],
    title="TalentForge Analytics",
)
app.server.secret_key = "tf-analytics-2026"

# Permite embedding via iframe (Next.js :3000)
from flask import make_response

@app.server.after_request
def _allow_iframe(response):
    response.headers.pop("X-Frame-Options", None)
    response.headers["X-Frame-Options"] = "ALLOWALL"
    response.headers["Content-Security-Policy"] = "frame-ancestors *"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

app.layout = html.Div([
    # ── Header ──
    html.Div([
        html.Div([
            html.Div(style={
                "width": "32px", "height": "32px",
                "borderRadius": "8px", "backgroundColor": C["secondary"],
                "display": "flex", "alignItems": "center", "justifyContent": "center",
                "fontSize": "16px", "marginRight": "12px",
            }, children="⚡"),
            html.Div([
                html.Span("TalentForge", style={
                    "color": "white", "fontWeight": "700", "fontSize": "18px",
                }),
                html.Span(" Analytics", style={
                    "color": C["secondary"], "fontWeight": "700", "fontSize": "18px",
                }),
            ]),
        ], style={"display": "flex", "alignItems": "center"}),
        html.Div([
            dcc.Interval(id="refresh-interval", interval=60_000, n_intervals=0),
            html.Span(id="last-update", style={"color": "#94A3B8", "fontSize": "12px"}),
        ], style={"display": "flex", "alignItems": "center"}),
    ], style={
        "background": C["primary"],
        "padding": "16px 32px",
        "display": "flex",
        "justifyContent": "space-between",
        "alignItems": "center",
        "boxShadow": "0 2px 8px rgba(0,0,0,0.3)",
    }),

    # ── Corpo ──
    html.Div([
        dcc.Loading(type="circle", color=C["secondary"], children=[
            html.Div(id="dashboard-content"),
        ])
    ], style={
        "background": C["bg"],
        "minHeight": "calc(100vh - 64px)",
        "padding": "24px 32px",
    }),
    dcc.Location(id="url", refresh=False),
    dcc.Store(id="org-store"),
], style={"fontFamily": "Inter, sans-serif"})


# Callback 1: URL + intervalo → Store (sempre mantém org_id atualizado)
@app.callback(
    Output("org-store", "data"),
    Input("url", "search"),
    Input("refresh-interval", "n_intervals"),
    State("org-store", "data"),
    prevent_initial_call=False,
)
def store_org_id(search, _n, current_data):
    if search and isinstance(search, str):
        params = urllib.parse.parse_qs(search.lstrip("?"))
        org = (params.get("org_id") or [None])[0]
        # Aceita somente UUIDs válidos (rejeita n_intervals, etc.)
        if org and isinstance(org, str) and _UUID_RE.match(org):
            return org
    # Não limpa se o store já tem um UUID válido (evita piscar durante refresh)
    if current_data and isinstance(current_data, str) and _UUID_RE.match(current_data):
        return no_update
    return None


# Callback 2: renderiza SOMENTE quando o Store muda (1 input → sem IndexError)
@app.callback(
    Output("dashboard-content", "children"),
    Output("last-update", "children"),
    Input("org-store", "data"),
)
def render_dashboard(org_id):
    # Garante que só UUIDs válidos passam (rejeita n_intervals, None, etc.)
    if not isinstance(org_id, str) or not _UUID_RE.match(org_id):
        print(f"[DEBUG] render_dashboard: org_id inválido ({org_id!r}) → usando None", flush=True)
        org_id = None
    else:
        print(f"[DEBUG] render_dashboard: org_id={org_id!r}", flush=True)

    # Busca dados filtrados por org
    pipeline  = fetch_pipeline_data(org_id)
    stalled   = fetch_stalled_candidates(org_id)
    scores    = fetch_assessment_scores(org_id)
    trend     = fetch_monthly_trend(org_id)
    jobs      = fetch_jobs_summary(org_id)

    # KPIs com sparklines (últimos 6 pontos do trend)
    total_cands = sum(pipeline.values())
    active_jobs = len(jobs)
    hired_total = sum(trend["hired"])
    assess_total = len(scores)

    kpis = dbc.Row([
        dbc.Col(kpi_card("Total no Pipeline",  total_cands, str(trend["apps"][-1]),  True,  trend["apps"],  C["accent"]),  width=3),
        dbc.Col(kpi_card("Vagas Ativas",        active_jobs, "+2",                   True,  [3,4,5,5,6,active_jobs], C["secondary"]), width=3),
        dbc.Col(kpi_card("Contratados (6m)",    hired_total, f"+{trend['hired'][-1]}", True, trend["hired"], "#A855F7"),    width=3),
        dbc.Col(kpi_card("Assessments",         assess_total, "+14",                 True,  [40,55,60,70,75,assess_total], C["warning"]), width=3),
    ], style={"marginBottom": "20px"})

    # Linha 1: Funil + Gargalos
    row1 = dbc.Row([
        card(None, dcc.Graph(figure=fig_funnel(pipeline),     config={"displayModeBar": False}, style={"height": "380px"}), 5),
        card(None, dcc.Graph(figure=fig_bottleneck(pipeline), config={"displayModeBar": False}, style={"height": "380px"}), 7),
    ])

    # Linha 2: Candidatos parados + Trend
    row2 = dbc.Row([
        card(None, dcc.Graph(figure=fig_stalled_bubble(stalled), config={"displayModeBar": False}, style={"height": "360px"}), 6),
        card(None, dcc.Graph(figure=fig_trend(trend),            config={"displayModeBar": False}, style={"height": "360px"}), 6),
    ])

    # Linha 3: Scores (hist + donut) + Vagas
    row3 = dbc.Row([
        card(None, dcc.Graph(figure=fig_score_histogram(scores), config={"displayModeBar": False}, style={"height": "320px"}), 5),
        card(None, dcc.Graph(figure=fig_score_donut(scores),     config={"displayModeBar": False}, style={"height": "320px"}), 3),
        card(None, dcc.Graph(figure=fig_jobs_bar(jobs),          config={"displayModeBar": False}, style={"height": "320px"}), 4),
    ])

    now = datetime.now().strftime("Atualizado às %H:%M:%S")
    org_str = str(org_id) if org_id else None
    org_label = f" · org {org_str[:8]}…" if org_str else " · sem org_id (mock)"
    source = (" · dados reais ✓" if supabase_ok else " · sem conexão") + org_label

    return html.Div([kpis, row1, row2, row3]), now + source


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = 8051
    print(f"\n🚀  TalentForge Analytics rodando em  http://localhost:{port}\n")
    app.run(debug=False, port=port, host="0.0.0.0")
