'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Avatar, Textarea } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { candidatesApi, applicationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatDateTime, getApplicationStatusLabel, getApplicationStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  Briefcase,
  MessageSquare,
  Send,
  Brain,
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  tags?: string[];
  notes?: Array<{ id: string; note: string; createdAt: string; authorName: string }>;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  currentStage: string;
  appliedAt: string;
  fitScore?: number;
}

export default function CandidateDetailPage() {
  const { id } = useParams();
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (currentOrg?.id && session?.access_token && id) {
      loadCandidate();
    }
  }, [currentOrg?.id, session?.access_token, id]);

  const loadCandidate = async () => {
    try {
      const data = await candidatesApi.get(id as string, session!.access_token, currentOrg!.id);
      const candidateData = (data as any).data;
      setCandidate(candidateData);
      setApplications(candidateData.applications || []);
    } catch (error) {
      console.error('Failed to load candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      await candidatesApi.addNote(id as string, newNote, session!.access_token, currentOrg!.id);
      setNewNote('');
      loadCandidate();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Candidato não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={candidate.name}
        subtitle={candidate.headline || candidate.email}
        actions={
          <div className="flex gap-2">
            <Link href={`/candidates/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link href="/candidates">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar name={candidate.name} size="lg" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{candidate.name}</h2>
                    {candidate.headline && (
                      <p className="text-gray-600 mt-1">{candidate.headline}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                      <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Mail className="h-4 w-4" />
                        {candidate.email}
                      </a>
                      {candidate.phone && (
                        <a href={`tel:${candidate.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Phone className="h-4 w-4" />
                          {candidate.phone}
                        </a>
                      )}
                      {candidate.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {candidate.location}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      {candidate.linkedinUrl && (
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {candidate.resumeUrl && (
                        <a
                          href={candidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          Currículo
                        </a>
                      )}
                    </div>

                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {candidate.tags.map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications */}
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Aplicações ({applications.length})
                </h3>
              </div>
              <CardContent className="p-0">
                {applications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma aplicação registrada
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {applications.map((app) => (
                      <Link key={app.id} href={`/jobs/${app.jobId}`}>
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{app.jobTitle}</p>
                              <p className="text-sm text-gray-500">
                                Etapa: {app.currentStage}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={getApplicationStatusColor(app.status) as any}>
                                {getApplicationStatusLabel(app.status)}
                              </Badge>
                              {app.fitScore !== undefined && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Fit: {app.fitScore}%
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Aplicou em {formatDate(app.appliedAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notes */}
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notas
                </h3>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Add Note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicionar uma nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addingNote ? 'Adicionando...' : 'Adicionar Nota'}
                  </Button>
                </div>

                {/* Notes List */}
                {candidate.notes && candidate.notes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    {candidate.notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span>{note.authorName}</span>
                          <span>{formatDateTime(note.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Ações</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  Solicitar Avaliação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </CardContent>
            </Card>

            {/* Meta */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">
                  Cadastrado em {formatDate(candidate.createdAt)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
