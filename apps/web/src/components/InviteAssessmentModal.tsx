'use client';

import { useState, useEffect } from 'react';
import { Send, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface InviteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteAssessmentModal({ isOpen, onClose, onSuccess }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [assessmentType, setAssessmentType] = useState('disc');
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Get recruiter's organization
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!orgMembers) {
        throw new Error('Organização não encontrada');
      }

      // Create or get candidate
      let candidateId = '';
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', email)
        .single();

      if (existingCandidate) {
        candidateId = existingCandidate.id;
      } else {
        const { data: newCandidate } = await supabase
          .from('candidates')
          .insert({
            owner_org_id: orgMembers.org_id,
            full_name: candidateName || email.split('@')[0],
            email: email,
          })
          .select('id')
          .single();

        if (newCandidate) {
          candidateId = newCandidate.id;
        }
      }

      // Create assessment
      const { data: assessment } = await supabase
        .from('assessments')
        .insert({
          candidate_id: candidateId,
          candidate_user_id: existingCandidate?.id || '', // Will be updated when candidate accepts
          assessment_type: assessmentType,
          status: 'draft',
          title: `${assessmentType.toUpperCase()} Assessment`,
          description: `Assessment link: ${window.location.origin}/assessment/${assessmentType}`,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (!assessment) {
        throw new Error('Erro ao criar avaliação');
      }

      // Generate token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create invitation
      const { error } = await supabase
        .from('assessment_invitations')
        .insert({
          assessment_id: assessment.id,
          invited_by: user.id,
          invited_to_email: email,
          token: token,
          token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      setSent(true);
      setTimeout(() => {
        setEmail('');
        setCandidateName('');
        setAssessmentType('disc');
        setSent(false);
        onClose();
        onSuccess();
      }, 2000);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Convite de Avaliação</DialogTitle>
          <DialogDescription>
            Convide um candidato para realizar uma avaliação DISC
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-8">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Convite enviado com sucesso!</p>
            <p className="text-sm text-gray-600">
              Um link para a avaliação foi enviado para {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Nome do Candidato
              </label>
              <Input
                placeholder="Digite o nome"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email do Candidato
              </label>
              <Input
                type="email"
                placeholder="candidato@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Tipo de Avaliação
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="disc">DISC - Personalidade e Comportamento</option>
                <option value="mbti">MBTI - Tipo de Personalidade (Em breve)</option>
                <option value="technical">Teste Técnico (Em breve)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !email}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
