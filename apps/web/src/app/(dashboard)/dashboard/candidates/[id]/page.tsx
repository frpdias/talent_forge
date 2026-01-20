'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Edit, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Palette,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createBrowserClient } from '@supabase/ssr';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  experience_years?: number;
  skills?: string[];
  education?: string;
  work_experience?: string;
  bio?: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface ColorResult {
  primary_color: string;
  secondary_color: string;
  scores: {
    vermelho: number;
    amarelo: number;
    verde: number;
    azul: number;
  };
}

interface DISCResult {
  dominance_score: number;
  influence_score: number;
  steadiness_score: number;
  conscientiousness_score: number;
  primary_profile: string;
  description: string;
}

interface PIResult {
  natural_profile: {
    direção: number;
    energia_social: number;
    ritmo: number;
    estrutura: number;
  };
  adapted_profile: {
    direção: number;
    energia_social: number;
    ritmo: number;
    estrutura: number;
  };
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [colorResult, setColorResult] = useState<ColorResult | null>(null);
  const [discResult, setDiscResult] = useState<DISCResult | null>(null);
  const [piResult, setPiResult] = useState<PIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState<Partial<Candidate>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'tests' | 'notes'>('profile');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, [candidateId]);

  async function loadData() {
    try {
      setLoading(true);

      // Get candidate profile
      const { data: candidateData } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateData) {
        setCandidate(candidateData);
        setEditedCandidate(candidateData);
      }

      // Get notes
      const { data: notesData } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (notesData) {
        setNotes(notesData);
      }

      // Get Color assessment
      const { data: colorData } = await supabase
        .from('color_assessments')
        .select('*, color_assessment_results(*)')
        .eq('candidate_id', candidateId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (colorData?.color_assessment_results) {
        const result = colorData.color_assessment_results as any;
        setColorResult({
          primary_color: result.primary_color,
          secondary_color: result.secondary_color,
          scores: {
            vermelho: result.red_score || 0,
            amarelo: result.yellow_score || 0,
            verde: result.green_score || 0,
            azul: result.blue_score || 0,
          },
        });
      }

      // Get DISC assessment (from color_assessment_results if it has DISC data)
      const { data: discData } = await supabase
        .from('color_assessment_results')
        .select('*')
        .eq('candidate_id', candidateId)
        .not('dominance_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (discData) {
        setDiscResult({
          dominance_score: discData.dominance_score || 0,
          influence_score: discData.influence_score || 0,
          steadiness_score: discData.steadiness_score || 0,
          conscientiousness_score: discData.conscientiousness_score || 0,
          primary_profile: discData.primary_profile || '',
          description: discData.description || '',
        });
      }

      // Get PI assessment
      const { data: piData } = await supabase
        .from('pi_assessments')
        .select('*, pi_assessment_results(*)')
        .eq('candidate_id', candidateId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (piData?.pi_assessment_results) {
        const result = piData.pi_assessment_results as any;
        setPiResult({
          natural_profile: {
            direção: result.natural_direcao || 0,
            energia_social: result.natural_energia_social || 0,
            ritmo: result.natural_ritmo || 0,
            estrutura: result.natural_estrutura || 0,
          },
          adapted_profile: {
            direção: result.adapted_direcao || 0,
            energia_social: result.adapted_energia_social || 0,
            ritmo: result.adapted_ritmo || 0,
            estrutura: result.adapted_estrutura || 0,
          },
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      const { error } = await supabase
        .from('candidate_profiles')
        .update(editedCandidate)
        .eq('id', candidateId);

      if (error) throw error;

      setCandidate({ ...candidate, ...editedCandidate } as Candidate);
      setEditMode(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Erro ao salvar perfil');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('candidate_notes')
        .insert([
          {
            candidate_id: candidateId,
            content: newNote,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setNotes([data, ...notes]);
        setNewNote('');
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      alert(error.message || 'Erro ao adicionar anotação');
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    try {
      const { error } = await supabase
        .from('candidate_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert(error.message || 'Erro ao excluir anotação');
    }
  }

  const getColorBadge = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; name: string }> = {
      vermelho: { bg: 'bg-red-100', text: 'text-red-700', name: 'Vermelho (Diretor)' },
      amarelo: { bg: 'bg-yellow-100', text: 'text-yellow-700', name: 'Amarelo (Comunicador)' },
      verde: { bg: 'bg-green-100', text: 'text-green-700', name: 'Verde (Planejador)' },
      azul: { bg: 'bg-blue-100', text: 'text-blue-700', name: 'Azul (Analítico)' },
    };
    const colorInfo = colorMap[color.toLowerCase()] || colorMap.vermelho;
    return (
      <Badge className={`${colorInfo.bg} ${colorInfo.text}`}>
        {colorInfo.name}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">Candidato não encontrado</p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title={candidate.full_name}
        subtitle={candidate.email}
        actions={
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Perfil e Currículo
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'tests'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Resultados dos Testes
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'notes'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Anotações ({notes.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Informações Pessoais</CardTitle>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.full_name || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{candidate.full_name}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <p className="text-lg">{candidate.email}</p>
                </div>

                <div>
                  <Label>Telefone</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.phone || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <Label>Localização</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.location || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, location: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.location || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Headline Profissional</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.headline || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, headline: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.headline || '-'}</p>
                  )}
                </div>

                <div>
                  <Label>Anos de Experiência</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editedCandidate.experience_years || 0}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, experience_years: parseInt(e.target.value) })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.experience_years || 0} anos</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Biografia</Label>
                  {editMode ? (
                    <Textarea
                      rows={4}
                      value={editedCandidate.bio || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, bio: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{candidate.bio || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Educação</Label>
                  {editMode ? (
                    <Textarea
                      rows={3}
                      value={editedCandidate.education || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, education: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{candidate.education || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Experiência Profissional</Label>
                  {editMode ? (
                    <Textarea
                      rows={6}
                      value={editedCandidate.work_experience || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, work_experience: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{candidate.work_experience || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            {/* Color Assessment */}
            {colorResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Avaliação de Cores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label className="mb-2 block">Perfil Primário</Label>
                    {getColorBadge(colorResult.primary_color)}
                    {colorResult.secondary_color && (
                      <>
                        <Label className="mb-2 block mt-4">Perfil Secundário</Label>
                        {getColorBadge(colorResult.secondary_color)}
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>Distribuição de Cores</Label>
                    {Object.entries(colorResult.scores).map(([color, score]) => (
                      <div key={color}>
                        <div className="flex justify-between mb-2">
                          <span className="capitalize font-medium">{color}</span>
                          <span className="text-sm font-bold">{score}%</span>
                        </div>
                        <Progress value={score} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DISC Assessment */}
            {discResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Avaliação DISC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label className="mb-2 block">Perfil Primário</Label>
                    <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                      {discResult.primary_profile}
                    </Badge>
                    <p className="text-gray-700 mt-3">{discResult.description}</p>
                  </div>

                  <div className="space-y-4">
                    <Label>Distribuição DISC</Label>
                    {[
                      { label: 'Dominância (D)', score: discResult.dominance_score, color: 'bg-red-500' },
                      { label: 'Influência (I)', score: discResult.influence_score, color: 'bg-yellow-500' },
                      { label: 'Estabilidade (S)', score: discResult.steadiness_score, color: 'bg-green-500' },
                      { label: 'Consciência (C)', score: discResult.conscientiousness_score, color: 'bg-blue-500' },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{label}</span>
                          <span className="text-sm font-bold">{score}%</span>
                        </div>
                        <Progress value={score} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PI Assessment */}
            {piResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Avaliação PI (Predictive Index)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-4 block text-lg">Perfil Natural</Label>
                      <div className="space-y-4">
                        {Object.entries(piResult.natural_profile).map(([axis, score]) => (
                          <div key={axis}>
                            <div className="flex justify-between mb-2">
                              <span className="capitalize font-medium">{axis.replace('_', ' ')}</span>
                              <span className="text-sm font-bold">{score}</span>
                            </div>
                            <Progress value={(score / 100) * 100} className="h-3" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-4 block text-lg">Perfil Adaptado</Label>
                      <div className="space-y-4">
                        {Object.entries(piResult.adapted_profile).map(([axis, score]) => (
                          <div key={axis}>
                            <div className="flex justify-between mb-2">
                              <span className="capitalize font-medium">{axis.replace('_', ' ')}</span>
                              <span className="text-sm font-bold">{score}</span>
                            </div>
                            <Progress value={(score / 100) * 100} className="h-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!colorResult && !discResult && !piResult && (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma avaliação concluída
                  </h3>
                  <p className="text-gray-500">
                    O candidato ainda não completou nenhuma avaliação comportamental
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Anotação</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Digite sua anotação sobre o candidato..."
                  className="mb-4"
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Anotação
                </Button>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma anotação ainda
                  </h3>
                  <p className="text-gray-500">
                    Adicione anotações sobre o candidato para referência futura
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString('pt-BR')}
                        </span>
                        <Button
                          onClick={() => handleDeleteNote(note.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
