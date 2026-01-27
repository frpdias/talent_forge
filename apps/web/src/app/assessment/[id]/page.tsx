'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assessmentsApi } from '@/lib/api';
import { Button, Card, CardContent } from '@/components/ui';
import { Brain, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { value: number; label: string }[];
}

interface Assessment {
  id: string;
  kind: string;
  candidateName: string;
  questions: Question[];
}

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment();
    }
  }, [id]);

  const loadAssessment = async () => {
    try {
      const data = await assessmentsApi.getQuestions(id as string);
      if ((data as any).completed) {
        setCompleted(true);
      }
      setAssessment(data as any);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value: number) => {
    if (!assessment) return;
    
    const question = assessment.questions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [question.id]: value }));

    // Auto advance to next question
    if (currentQuestion < assessment.questions.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    const unanswered = assessment.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Por favor, responda todas as perguntas. Faltam ${unanswered.length} respostas.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await assessmentsApi.submit(id as string, formattedAnswers);
      setCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Avaliação não encontrada</h1>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Avaliação concluída!</h1>
            <p className="text-gray-500 mb-6">
              Obrigado por completar a avaliação comportamental. Seus resultados foram enviados para análise.
            </p>
            <p className="text-sm text-gray-400">
              Você pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) return null;

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliação Comportamental</h1>
          <p className="text-gray-500 mt-1">Olá, {assessment.candidateName}!</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-500">
              Pergunta {currentQuestion + 1} de {assessment.questions.length}
            </span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <p className="text-lg font-medium text-gray-900 mb-6">{question.text}</p>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    answers[question.id] === option.value
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentQuestion === assessment.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < assessment.questions.length}
            >
              {submitting ? 'Enviando...' : 'Enviar Avaliação'}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              disabled={answers[question.id] === undefined}
            >
              Próxima
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Answer Summary */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-500 text-center">
            {answeredCount} de {assessment.questions.length} perguntas respondidas
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {assessment.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === currentQuestion
                    ? 'bg-blue-600 scale-125'
                    : answers[q.id] !== undefined
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
