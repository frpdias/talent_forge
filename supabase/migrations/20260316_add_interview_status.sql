-- Migration: Adicionar status de entrevista ao enum application_status
-- Necessário para o pipeline poder salvar os status de Entrevista c/ RH e Entrevista c/ Gestor

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_hr' AFTER 'in_process';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_manager' AFTER 'interview_hr';
