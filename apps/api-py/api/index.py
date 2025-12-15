import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from supabase import Client, create_client


def get_supabase_client() -> Client:
    try:
        url = os.environ["SUPABASE_URL"]
        service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    except KeyError as exc:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY") from exc
    return create_client(url, service_key)


app = FastAPI(title="Talent Forge API", version="1.0.0")
supabase = get_supabase_client()


@app.get("/")
def root():
    return {"status": "ok", "service": "talent-forge-api", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/color/questions")
def list_color_questions():
    resp = supabase.table("color_questions").select("*").eq("active", True).order(
        "question_number"
    ).execute()
    return {"items": resp.data}


@app.get("/disc/questions")
def list_disc_questions():
    resp = supabase.table("disc_questions").select("*").eq("active", True).order(
        "question_number"
    ).execute()
    return {"items": resp.data}


@app.post("/color/assessments/{assessment_id}/responses")
def create_color_response(
    assessment_id: str,
    payload: dict,
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


@app.post("/disc/assessments/{assessment_id}/responses")
def create_disc_response(assessment_id: str, payload: dict):
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


@app.post("/color/assessments")
def create_color_assessment(payload: dict):
    candidate_user_id = payload.get("candidate_user_id")
    if not candidate_user_id:
        raise HTTPException(status_code=400, detail="candidate_user_id is required")
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
    return {"data": resp.data}


@app.post("/disc/assessments")
def create_disc_assessment(payload: dict):
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


@app.get("/color/assessments/{assessment_id}/scores")
def get_color_scores(assessment_id: str):
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


@app.get("/disc/assessments/{assessment_id}/scores")
def get_disc_scores(assessment_id: str):
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
