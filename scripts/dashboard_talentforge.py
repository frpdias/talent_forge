"""
TalentForge Dashboard — Plotly Dash
Réplica interativa do dashboard de recrutamento.

Instalação:
    pip install dash dash-bootstrap-components plotly

Execução:
    python scripts/dashboard_talentforge.py
    Acesse: http://localhost:8050
"""

import dash
from dash import dcc, html, Input, Output, callback
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

# ─── Paleta (idêntica ao design-system.md) ───────────────────────────────────
COLORS = {
    "primary":    "#141042",
    "secondary":  "#10B981",
    "accent":     "#3B82F6",
    "warning":    "#F97316",
    "bg":         "#F5F5F3",
    "card":       "#FFFFFF",
    "text":       "#111111",
    "muted":      "#6B7280",
    "sidebar_txt":"#CBD5E1",
    "active":     "#1F4ED8",
}

# ─── Dados mock (substituir por queries Supabase se quiser dados reais) ────────
STATS = [
    {"label": "Vagas Ativas",   "value": 12,  "delta": "+2",  "color": COLORS["accent"]},
    {"label": "Candidatos",      "value": 84,  "delta": "+17", "color": COLORS["secondary"]},
    {"label": "Em Avaliação",    "value": 27,  "delta": "+5",  "color": COLORS["warning"]},
    {"label": "Contratados",     "value": 6,   "delta": "+1",  "color": "#A855F7"},
]

PIPELINE = {
    "Triagem": [
        {"nome": "Ana Souza",      "vaga": "Dev Full-Stack", "score": None},
        {"nome": "Carlos Lima",    "vaga": "Dev Full-Stack", "score": None},
        {"nome": "Paula Mendes",   "vaga": "Dev Full-Stack", "score": None},
    ],
    "Entrevista": [
        {"nome": "Bruno Costa",    "vaga": "Dev Full-Stack", "score": None},
        {"nome": "Julia Nunes",    "vaga": "Dev Full-Stack", "score": None},
    ],
    "Avaliação": [
        {"nome": "Marcos Vieira",  "vaga": "Dev Full-Stack", "score": 78},
        {"nome": "Laura Pinto",    "vaga": "Dev Full-Stack", "score": 85},
        {"nome": "Rafael Dias",    "vaga": "Dev Full-Stack", "score": 62},
    ],
    "Proposta": [
        {"nome": "Camila Torres",  "vaga": "Dev Full-Stack", "score": 92},
    ],
}

VAGAS = [
    {"titulo": "Desenvolvedor Full-Stack",    "org": "Fartech",       "candidatos": 18, "status": "Ativa"},
    {"titulo": "UX Designer Sênior",          "org": "Fartech",       "candidatos": 11, "status": "Ativa"},
    {"titulo": "Gerente de Produto",          "org": "Fartech",       "candidatos": 7,  "status": "Ativa"},
    {"titulo": "Analista de Dados",           "org": "Acme Corp",     "candidatos": 22, "status": "Ativa"},
    {"titulo": "Engenheiro de DevOps",        "org": "Acme Corp",     "candidatos": 5,  "status": "Pausada"},
]

MONTHLY_APPS = {
    "meses": ["Out", "Nov", "Dez", "Jan", "Fev", "Mar"],
    "candidaturas": [42, 58, 35, 71, 63, 84],
    "contratacoes":  [3,   5,  2,   6,   4,   6],
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def stat_card(label, value, delta, color):
    return html.Div(
        style={
            "background": COLORS["card"],
            "borderRadius": "12px",
            "padding": "20px 24px",
            "boxShadow": "0 1px 3px rgba(0,0,0,.08)",
            "flex": "1",
            "minWidth": "160px",
        },
        children=[
            html.P(label, style={"fontSize": "13px", "color": COLORS["muted"], "margin": "0 0 8px"}),
            html.Div(
                style={"display": "flex", "alignItems": "flex-end", "gap": "10px"},
                children=[
                    html.Span(str(value), style={"fontSize": "36px", "fontWeight": "700", "color": COLORS["text"], "lineHeight": "1"}),
                    html.Span(delta, style={"fontSize": "12px", "color": COLORS["secondary"], "marginBottom": "4px"}),
                ]
            ),
            html.Div(style={"height": "3px", "borderRadius": "2px", "background": color, "marginTop": "12px", "opacity": ".6"}),
        ]
    )


def kanban_card(candidato):
    score = candidato["score"]
    score_badge = html.Span(
        f"{score}",
        style={
            "background": "#10B981" if score and score >= 75 else "#F97316" if score else "transparent",
            "color": "white" if score else "transparent",
            "borderRadius": "6px",
            "padding": "1px 7px",
            "fontSize": "11px",
            "fontWeight": "600",
        }
    ) if score else html.Span()

    return html.Div(
        style={
            "background": COLORS["card"],
            "borderRadius": "8px",
            "padding": "12px 14px",
            "marginBottom": "8px",
            "boxShadow": "0 1px 2px rgba(0,0,0,.06)",
            "borderLeft": f"3px solid {COLORS['accent']}",
            "cursor": "pointer",
        },
        children=[
            html.Div(
                style={"display": "flex", "justifyContent": "space-between", "alignItems": "center"},
                children=[
                    html.Span(candidato["nome"], style={"fontSize": "13px", "fontWeight": "600", "color": COLORS["text"]}),
                    score_badge,
                ]
            ),
            html.Span(candidato["vaga"], style={"fontSize": "11px", "color": COLORS["muted"]}),
        ]
    )


def kanban_column(title, cards):
    color_map = {"Triagem": "#6B7280", "Entrevista": "#3B82F6", "Avaliação": "#F97316", "Proposta": "#10B981"}
    color = color_map.get(title, COLORS["primary"])
    return html.Div(
        style={"flex": "1", "minWidth": "200px"},
        children=[
            html.Div(
                style={"display": "flex", "alignItems": "center", "gap": "8px", "marginBottom": "12px"},
                children=[
                    html.Div(style={"width": "8px", "height": "8px", "borderRadius": "50%", "background": color}),
                    html.Span(title, style={"fontSize": "13px", "fontWeight": "600", "color": COLORS["text"]}),
                    html.Span(
                        str(len(cards)),
                        style={"background": "#F3F4F6", "color": COLORS["muted"], "borderRadius": "10px", "padding": "0 7px", "fontSize": "11px"}
                    ),
                ]
            ),
            html.Div([kanban_card(c) for c in cards]),
        ]
    )


def sidebar_item(label, icon, active=False):
    return html.Div(
        style={
            "display": "flex", "alignItems": "center", "gap": "10px",
            "padding": "9px 16px", "borderRadius": "8px", "cursor": "pointer",
            "background": COLORS["active"] if active else "transparent",
            "color": "white" if active else COLORS["sidebar_txt"],
            "fontSize": "13px", "fontWeight": "500" if active else "400",
            "marginBottom": "2px",
        },
        children=[html.Span(icon, style={"fontSize": "15px"}), html.Span(label)]
    )


# ─── Gráficos ─────────────────────────────────────────────────────────────────

def chart_candidaturas():
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=MONTHLY_APPS["meses"],
        y=MONTHLY_APPS["candidaturas"],
        name="Candidaturas",
        marker_color=COLORS["accent"],
        opacity=0.85,
    ))
    fig.add_trace(go.Scatter(
        x=MONTHLY_APPS["meses"],
        y=MONTHLY_APPS["contratacoes"],
        name="Contratações",
        mode="lines+markers",
        line=dict(color=COLORS["secondary"], width=2.5),
        marker=dict(size=7),
        yaxis="y2",
    ))
    fig.update_layout(
        paper_bgcolor="white", plot_bgcolor="white",
        margin=dict(l=16, r=16, t=10, b=10),
        height=220,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=11)),
        xaxis=dict(showgrid=False, tickfont=dict(size=11)),
        yaxis=dict(showgrid=True, gridcolor="#F3F4F6", tickfont=dict(size=11)),
        yaxis2=dict(overlaying="y", side="right", showgrid=False, tickfont=dict(size=11)),
        barmode="group",
    )
    return fig


def chart_funil():
    estagios = list(PIPELINE.keys())
    totais   = [len(v) for v in PIPELINE.values()]
    fig = go.Figure(go.Funnel(
        y=estagios,
        x=totais,
        textinfo="value+percent initial",
        marker=dict(color=[COLORS["muted"], COLORS["accent"], COLORS["warning"], COLORS["secondary"]]),
        connector={"line": {"color": "#E5E7EB", "width": 1}},
    ))
    fig.update_layout(
        paper_bgcolor="white", plot_bgcolor="white",
        margin=dict(l=16, r=16, t=10, b=10),
        height=220,
        font=dict(size=12),
    )
    return fig


# ─── Layout ───────────────────────────────────────────────────────────────────

sidebar = html.Div(
    style={
        "width": "220px", "minHeight": "100vh",
        "background": COLORS["primary"],
        "padding": "24px 16px",
        "display": "flex", "flexDirection": "column",
        "gap": "4px",
        "position": "fixed", "top": 0, "left": 0, "bottom": 0,
    },
    children=[
        # Logo
        html.Div(
            style={"display": "flex", "alignItems": "center", "gap": "10px", "marginBottom": "28px", "paddingLeft": "6px"},
            children=[
                html.Div("TF", style={
                    "width": "36px", "height": "36px", "borderRadius": "8px",
                    "background": COLORS["active"], "color": "white",
                    "display": "flex", "alignItems": "center", "justifyContent": "center",
                    "fontWeight": "700", "fontSize": "14px",
                }),
                html.Div(
                    children=[
                        html.Div("TALENT", style={"fontSize": "12px", "fontWeight": "700", "color": "white", "lineHeight": "1.1"}),
                        html.Div("FORGE",  style={"fontSize": "12px", "fontWeight": "300", "color": COLORS["secondary"], "lineHeight": "1.1"}),
                    ]
                )
            ]
        ),
        sidebar_item("Dashboard",   "◉", active=True),
        sidebar_item("Vagas",       "📋"),
        sidebar_item("Candidatos",  "👥"),
        sidebar_item("Pipeline",    "⚡"),
        sidebar_item("Empresas",    "🏢"),
        sidebar_item("Relatórios",  "📊"),
        html.Div(style={"flex": "1"}),
        html.Div(
            html.P("Fartech · Março 2026", style={"fontSize": "11px", "color": "#475569", "margin": "0", "paddingLeft": "6px"}),
        )
    ]
)

main_content = html.Div(
    style={"marginLeft": "220px", "padding": "32px", "background": COLORS["bg"], "minHeight": "100vh"},
    children=[

        # ── Header ──
        html.Div(
            style={"marginBottom": "28px"},
            children=[
                html.H1("Dashboard", style={"fontSize": "22px", "fontWeight": "700", "color": COLORS["text"], "margin": "0"}),
                html.P("Fartech · Março 2026", style={"fontSize": "13px", "color": COLORS["muted"], "margin": "4px 0 0"}),
            ]
        ),

        # ── Stat Cards ──
        html.Div(
            style={"display": "flex", "gap": "16px", "marginBottom": "28px", "flexWrap": "wrap"},
            children=[stat_card(**s) for s in STATS]
        ),

        # ── Pipeline Kanban ──
        html.Div(
            style={
                "background": COLORS["card"], "borderRadius": "12px",
                "padding": "20px 24px", "marginBottom": "24px",
                "boxShadow": "0 1px 3px rgba(0,0,0,.08)",
            },
            children=[
                html.Div(
                    style={"display": "flex", "alignItems": "center", "justifyContent": "space-between", "marginBottom": "16px"},
                    children=[
                        html.P("Pipeline · Desenvolvedor Full-Stack",
                               style={"fontWeight": "600", "fontSize": "14px", "color": COLORS["text"], "margin": "0"}),
                        html.Span("Ver todas as vagas →", style={"fontSize": "12px", "color": COLORS["accent"], "cursor": "pointer"}),
                    ]
                ),
                html.Div(
                    style={"display": "flex", "gap": "16px"},
                    children=[kanban_column(col, cards) for col, cards in PIPELINE.items()],
                ),
            ]
        ),

        # ── Gráficos ──
        html.Div(
            style={"display": "flex", "gap": "16px", "marginBottom": "24px", "flexWrap": "wrap"},
            children=[
                html.Div(
                    style={"background": COLORS["card"], "borderRadius": "12px", "padding": "20px 24px",
                           "flex": "2", "minWidth": "340px", "boxShadow": "0 1px 3px rgba(0,0,0,.08)"},
                    children=[
                        html.P("Candidaturas & Contratações", style={"fontWeight": "600", "fontSize": "14px", "color": COLORS["text"], "margin": "0 0 12px"}),
                        dcc.Graph(figure=chart_candidaturas(), config={"displayModeBar": False}),
                    ]
                ),
                html.Div(
                    style={"background": COLORS["card"], "borderRadius": "12px", "padding": "20px 24px",
                           "flex": "1", "minWidth": "280px", "boxShadow": "0 1px 3px rgba(0,0,0,.08)"},
                    children=[
                        html.P("Funil de Conversão", style={"fontWeight": "600", "fontSize": "14px", "color": COLORS["text"], "margin": "0 0 12px"}),
                        dcc.Graph(figure=chart_funil(), config={"displayModeBar": False}),
                    ]
                ),
            ]
        ),

        # ── Tabela de Vagas ──
        html.Div(
            style={"background": COLORS["card"], "borderRadius": "12px", "padding": "20px 24px",
                   "boxShadow": "0 1px 3px rgba(0,0,0,.08)"},
            children=[
                html.P("Vagas em Aberto", style={"fontWeight": "600", "fontSize": "14px", "color": COLORS["text"], "margin": "0 0 16px"}),
                html.Table(
                    style={"width": "100%", "borderCollapse": "collapse"},
                    children=[
                        html.Thead(
                            html.Tr([
                                html.Th(h, style={"textAlign": "left", "fontSize": "11px", "fontWeight": "600",
                                                   "color": COLORS["muted"], "padding": "6px 12px",
                                                   "borderBottom": "1px solid #F3F4F6", "textTransform": "uppercase", "letterSpacing": ".05em"})
                                for h in ["Título", "Organização", "Candidatos", "Status"]
                            ])
                        ),
                        html.Tbody([
                            html.Tr(
                                style={"borderBottom": "1px solid #F9FAFB"},
                                children=[
                                    html.Td(v["titulo"],     style={"padding": "10px 12px", "fontSize": "13px", "fontWeight": "500", "color": COLORS["text"]}),
                                    html.Td(v["org"],        style={"padding": "10px 12px", "fontSize": "13px", "color": COLORS["muted"]}),
                                    html.Td(str(v["candidatos"]), style={"padding": "10px 12px", "fontSize": "13px", "color": COLORS["muted"]}),
                                    html.Td(
                                        html.Span(
                                            v["status"],
                                            style={
                                                "background": "#D1FAE5" if v["status"] == "Ativa" else "#FEF3C7",
                                                "color":      "#065F46" if v["status"] == "Ativa" else "#92400E",
                                                "borderRadius": "20px", "padding": "2px 10px",
                                                "fontSize": "11px", "fontWeight": "600",
                                            }
                                        ),
                                        style={"padding": "10px 12px"},
                                    ),
                                ]
                            )
                            for v in VAGAS
                        ]),
                    ]
                )
            ]
        ),
    ]
)

# ─── App ──────────────────────────────────────────────────────────────────────

app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    ],
    title="TalentForge Dashboard",
    suppress_callback_exceptions=True,
)

app.layout = html.Div(
    style={"fontFamily": "Inter, sans-serif", "background": COLORS["bg"]},
    children=[sidebar, main_content]
)

if __name__ == "__main__":
    print("\n🚀  TalentForge Dashboard rodando em  http://localhost:8050\n")
    app.run(debug=True, port=8050)
