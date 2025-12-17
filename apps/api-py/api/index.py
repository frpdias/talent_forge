import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import JSONResponse
from supabase import Client, create_client

API_VERSION = "1.0.0"
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
JWT_ALG = "HS256"
ACCESS_EXP_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MIN", "60"))
REFRESH_EXP_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

if not JWT_SECRET:
    raise RuntimeError("Missing JWT secret (SUPABASE_JWT_SECRET or JWT_SECRET)")


def get_supabase_client() -> Client:
    try:
        url = os.environ["SUPABASE_URL"]
        service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    except KeyError as exc:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY") from exc
    return create_client(url, service_key)


app = FastAPI(title="Talent Forge API", version=API_VERSION)
supabase = get_supabase_client()
security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOWED_ORIGINS == "*" else [o.strip() for o in ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload.update({"exp": datetime.now(timezone.utc) + expires_delta})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")
    token = credentials.credentials
    return decode_token(token)


@app.get("/")
def root():
    return {"status": "ok", "service": "talent-forge-api", "version": API_VERSION}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ----------------------------
# Auth
# ----------------------------


@app.post("/v1/auth/login")
def login(payload: dict):
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password are required")

    try:
        auth_resp = supabase.auth.sign_in_with_password({"email": email, "password": password})
        user = auth_resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_token({"sub": user.id, "email": email, "type": "access"}, timedelta(minutes=ACCESS_EXP_MIN))
    refresh = create_token({"sub": user.id, "email": email, "type": "refresh"}, timedelta(days=REFRESH_EXP_DAYS))
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@app.post("/v1/auth/refresh")
def refresh(payload: dict):
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="refresh_token is required")
    data = decode_token(refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    new_access = create_token(
        {"sub": data.get("sub"), "email": data.get("email"), "type": "access"},
        timedelta(minutes=ACCESS_EXP_MIN),
    )
    return {"access_token": new_access, "token_type": "bearer"}


@app.get("/v1/color/questions")
def list_color_questions(user=Depends(get_current_user)):
    resp = supabase.table("color_questions").select("*").eq("active", True).order(
        "question_number"
    ).execute()
    return {"items": resp.data}


@app.get("/v1/disc/questions")
def list_disc_questions(user=Depends(get_current_user)):
    resp = supabase.table("disc_questions").select("*").eq("active", True).order(
        "question_number"
    ).execute()
    return {"items": resp.data}


@app.post("/v1/color/assessments/{assessment_id}/responses")
def create_color_response(
    assessment_id: str,
    payload: dict,
    user=Depends(get_current_user),
):
    selected_color = payload.get("selected_color")
    question_id = payload.get("question_id")
    if not selected_color or not question_id:
        raise HTTPException(status_code=400, detail="selected_color and question_id are required")
    resp = (
        supabase.table("color_responses")
        .insert(
            {
                "assessment_id": assessment_id,
                "question_id": question_id,
                "selected_color": selected_color,
            }
        )
        .execute()
    )
    return {"data": resp.data}


@app.post("/v1/disc/assessments/{assessment_id}/responses")
def create_disc_response(assessment_id: str, payload: dict, user=Depends(get_current_user)):
    selected_trait = payload.get("selected_trait")
    question_id = payload.get("question_id")
    if not selected_trait or not question_id:
        raise HTTPException(status_code=400, detail="selected_trait and question_id are required")
    resp = (
        supabase.table("disc_responses")
        .insert(
            {
                "assessment_id": assessment_id,
                "question_id": question_id,
                "selected_trait": selected_trait,
            }
        )
        .execute()
    )
    return {"data": resp.data}


@app.post("/v1/color/assessments")
def create_color_assessment(payload: dict, user=Depends(get_current_user)):
    candidate_user_id = payload.get("candidate_user_id")
    if not candidate_user_id:
        print("[ERRO] candidate_user_id ausente no payload de create_color_assessment")
        raise HTTPException(status_code=400, detail="candidate_user_id is required")
    try:
        resp = (
            supabase.table("color_assessments")
            .insert(
                {
                    "candidate_user_id": candidate_user_id,
                    "status": payload.get("status", "draft"),
                }
            )
            .execute()
        )
        if not resp.data:
            print(f"[ERRO] Falha ao criar color_assessment para user {candidate_user_id}: {resp}")
            raise HTTPException(status_code=500, detail="Erro ao criar assessment. Tente novamente.")
        print(f"[OK] Assessment criado: {resp.data}")
        return {"data": resp.data}
    except Exception as e:
        print(f"[EXCEPTION] Erro inesperado ao criar assessment: {e}")
        raise HTTPException(status_code=500, detail="Erro inesperado ao criar assessment.")


@app.post("/v1/disc/assessments")
def create_disc_assessment(payload: dict, user=Depends(get_current_user)):
    candidate_user_id = payload.get("candidate_user_id")
    if not candidate_user_id:
        raise HTTPException(status_code=400, detail="candidate_user_id is required")
    resp = (
        supabase.table("disc_assessments")
        .insert(
            {
                "candidate_user_id": candidate_user_id,
                "status": payload.get("status", "draft"),
            }
        )
        .execute()
    )
    return {"data": resp.data}


@app.get("/v1/color/assessments/{assessment_id}/scores")
def get_color_scores(assessment_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("color_assessments")
        .select("scores,primary_color,secondary_color,status")
        .eq("id", assessment_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="assessment not found")
    return resp.data


@app.get("/v1/disc/assessments/{assessment_id}/scores")
def get_disc_scores(assessment_id: str, user=Depends(get_current_user)):
    resp = (
        supabase.table("disc_assessments")
        .select("scores,primary_trait,secondary_trait,status")
        .eq("id", assessment_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="assessment not found")
    return resp.data


# ----------------------------
# Aliases sem /v1 (compat web atual)
# ----------------------------


@app.post("/color-assessments")
def create_color_assessment_public(payload: dict):
    candidate_user_id = payload.get("candidateUserId") or payload.get("candidate_user_id")
    if not candidate_user_id:
        raise HTTPException(status_code=400, detail="candidateUserId is required")
    resp = (
        supabase.table("color_assessments")
        .insert({"candidate_user_id": candidate_user_id, "status": "draft"})
        .execute()
    )
    return {"data": resp.data}


@app.get("/color-assessments/questions")
def list_color_questions_public():
    resp = (
        supabase.table("color_questions")
        .select("*")
        .eq("active", True)
        .order("question_number")
        .execute()
    )
    return {"items": resp.data}


@app.post("/color-assessments/{assessment_id}/responses")
def create_color_response_public(assessment_id: str, payload: dict):
    question_id = payload.get("questionId") or payload.get("question_id")
    selected_color = payload.get("selectedColor") or payload.get("selected_color")
    if not selected_color or not question_id:
        print(f"[ERRO] selectedColor/questionId ausentes no payload: {payload}")
        raise HTTPException(status_code=400, detail="selectedColor and questionId are required")
    # Verifica se assessment existe
    assessment = supabase.table("color_assessments").select("id").eq("id", assessment_id).single().execute()
    if not assessment.data:
        print(f"[ERRO] Assessment {assessment_id} não encontrado ao tentar salvar resposta.")
        raise HTTPException(status_code=404, detail="Assessment não encontrado.")
    try:
        resp = (
            supabase.table("color_responses")
            .insert(
                {
                    "assessment_id": assessment_id,
                    "question_id": question_id,
                    "selected_color": selected_color,
                }
            )
            .execute()
        )
        if not resp.data:
            print(f"[ERRO] Falha ao salvar resposta: {resp}")
            raise HTTPException(status_code=500, detail="Erro ao salvar resposta. Tente novamente.")
        print(f"[OK] Resposta salva: {resp.data}")
        return {"data": resp.data}
    except Exception as e:
        print(f"[EXCEPTION] Erro inesperado ao salvar resposta: {e}")
        raise HTTPException(status_code=500, detail="Erro inesperado ao salvar resposta.")


@app.post("/color-assessments/{assessment_id}/complete")
def finalize_color_assessment_public(assessment_id: str):
    # Buscar todas as respostas desse assessment
    resp_answers = (
        supabase.table("color_responses")
        .select("selected_color")
        .eq("assessment_id", assessment_id)
        .execute()
    )
    answers = resp_answers.data or []
    if not answers:
        print(f"[ERRO] Nenhuma resposta encontrada para assessment {assessment_id}")
        raise HTTPException(status_code=400, detail="Nenhuma resposta encontrada para este assessment.")

    # Contar ocorrências de cada cor
    from collections import Counter
    color_counts = Counter([a.get("selected_color") for a in answers if a.get("selected_color")])
    if not color_counts:
        print(f"[ERRO] Nenhuma cor válida encontrada nas respostas do assessment {assessment_id}")
        raise HTTPException(status_code=400, detail="Respostas inválidas para este assessment.")

    # Calcular scores (quantidade de cada cor)
    scores = dict(color_counts)
    # Ordenar por maior score
    order = sorted(scores, key=scores.get, reverse=True)
    primary_color = order[0] if order else None
    secondary_color = order[1] if len(order) > 1 else None

    # Atualizar assessment com scores, cor primária/secundária e status
    supabase.table("color_assessments").update({
        "scores": scores,
        "primary_color": primary_color,
        "secondary_color": secondary_color,
        "status": "completed"
    }).eq("id", assessment_id).execute()

    # Buscar e retornar dados atualizados
    resp = (
        supabase.table("color_assessments")
        .select("scores,primary_color,secondary_color,status")
        .eq("id", assessment_id)
        .single()
        .execute()
    )
    return {"data": resp.data}


@app.get("/color-assessments/latest")
def latest_color_assessment_public():
    resp = (
        supabase.table("color_assessments")
        .select("id,candidate_user_id,status,primary_color,secondary_color,scores,created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {"data": resp.data[0] if resp.data else None}


@app.post("/pi-assessments")
def create_pi_assessment_public(payload: dict):
    candidate_user_id = payload.get("candidateUserId") or payload.get("candidate_user_id")
    if not candidate_user_id:
        raise HTTPException(status_code=400, detail="candidateUserId is required")
    resp = (
        supabase.table("pi_assessments")
        .insert({"candidate_user_id": candidate_user_id, "status": "draft"})
        .execute()
    )
    return {"data": resp.data}


@app.get("/pi-assessments/questions")
def list_pi_questions_public():
    resp = (
        supabase.table("pi_situational_questions")
        .select("*")
        .eq("active", True)
        .order("question_number")
        .execute()
    )
    return {"items": resp.data}


@app.get("/pi-assessments/descriptors")
def list_pi_descriptors_public():
    resp = (
        supabase.table("pi_descriptors")
        .select("*")
        .eq("active", True)
        .order("position")
        .execute()
    )
    return {"items": resp.data}


@app.post("/pi-assessments/{assessment_id}/responses/situational")
def create_pi_situational_public(assessment_id: str, payload: dict):
    question_id = payload.get("questionId") or payload.get("question_id")
    selected_axis = payload.get("selectedAxis") or payload.get("selected_axis")
    block = payload.get("block")
    if not question_id or not selected_axis or not block:
        raise HTTPException(status_code=400, detail="questionId, selectedAxis e block são obrigatórios")
    resp = (
        supabase.table("pi_situational_responses")
        .insert(
            {
                "assessment_id": assessment_id,
                "question_id": question_id,
                "selected_axis": selected_axis,
                "block": block,
            }
        )
        .execute()
    )
    return {"data": resp.data}


@app.post("/pi-assessments/{assessment_id}/responses/descriptor")
def create_pi_descriptor_public(assessment_id: str, payload: dict):
    descriptor_id = payload.get("descriptorId") or payload.get("descriptor_id")
    block = payload.get("block")
    if not descriptor_id or not block:
        raise HTTPException(status_code=400, detail="descriptorId e block são obrigatórios")
    resp = (
        supabase.table("pi_descriptor_responses")
        .upsert(
            {
                "assessment_id": assessment_id,
                "descriptor_id": descriptor_id,
                "block": block,
            }
        )
        .execute()
    )
    return {"data": resp.data}


@app.post("/pi-assessments/{assessment_id}/complete")
def finalize_pi_assessment_public(assessment_id: str):
    supabase.table("pi_assessments").update({"status": "completed"}).eq("id", assessment_id).execute()
    resp = (
        supabase.table("pi_assessments")
        .select("scores_natural,scores_adapted,gaps,status")
        .eq("id", assessment_id)
        .single()
        .execute()
    )
    return {"data": resp.data}


@app.get("/pi-assessments/latest")
def latest_pi_assessment_public():
    resp = (
        supabase.table("pi_assessments")
        .select("id,candidate_user_id,status,scores_natural,scores_adapted,gaps,created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {"data": resp.data[0] if resp.data else None}
