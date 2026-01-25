'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit2, Save, X, StickyNote } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Note {
  id: string;
  candidateId: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  note: string;
  context: string;
  createdAt: string;
  updatedAt?: string;
}

interface NotesPanelProps {
  candidateId: string;
  context: 'profile' | 'resume' | 'assessments' | 'interview' | 'general';
  className?: string;
  placeholder?: string;
}

const contextLabels = {
  profile: 'Perfil',
  resume: 'Currículo',
  assessments: 'Testes',
  interview: 'Entrevista',
  general: 'Geral',
};

export function NotesPanel({
  candidateId,
  context,
  className = '',
  placeholder,
}: NotesPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState<string>('Você');

  // Get auth user
  useEffect(() => {
    const getAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('[NotesPanel] Token obtido');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('[NotesPanel] User ID:', user.id);
        setUserId(user.id);
        const label =
          (user.user_metadata as any)?.full_name ||
          (user.user_metadata as any)?.name ||
          user.email ||
          'Você';
        setUserLabel(label);
      }
    };
    
    getAuth();
  }, [supabase]);

  // Load notes on mount and when context changes
  useEffect(() => {
    console.log('[NotesPanel] useEffect triggered:', { candidateId, context, userId: !!userId });
    if (userId) {
      loadNotes();
    }
  }, [candidateId, context, userId]);

  const loadNotes = async () => {
    if (!userId) {
      console.log('[NotesPanel] Missing userId');
      return;
    }
    
    console.log('[NotesPanel] Loading notes:', { candidateId, context });
    
    try {
      setLoading(true);
      let query = supabase
        .from('candidate_notes')
        .select('id, candidate_id, author_id, note, context, created_at, updated_at')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (context) {
        query = query.eq('context', context);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mappedNotes = (data || []).map((note: any) => ({
        id: note.id,
        candidateId: note.candidate_id,
        authorId: note.author_id,
        authorName: note.author_id === userId ? userLabel : 'Recrutador',
        authorEmail: undefined,
        note: note.note,
        context: note.context || 'general',
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }));

      console.log('[NotesPanel] Loaded notes:', mappedNotes);
      setNotes(mappedNotes);
    } catch (error) {
      console.error('[NotesPanel] Failed to load notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !userId) {
      console.log('[NotesPanel] Cannot add note:', { hasText: !!newNote.trim(), userId: !!userId });
      return;
    }

    console.log('[NotesPanel] Adding note:', { candidateId, context, noteLength: newNote.length });
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('candidate_notes')
        .insert({
          candidate_id: candidateId,
          author_id: userId,
          note: newNote.trim(),
          context,
        });

      if (error) throw error;

      console.log('[NotesPanel] Note created successfully');
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('[NotesPanel] Failed to create note:', error);
      alert(`Erro ao criar anotação: ${(error as Error)?.message || 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.note);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editText.trim() || !userId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('candidate_notes')
        .update({ note: editText.trim() })
        .eq('id', noteId)
        .eq('candidate_id', candidateId)
        .eq('author_id', userId);

      if (error) throw error;

      setEditingId(null);
      setEditText('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
      alert(`Erro ao atualizar anotação: ${(error as Error)?.message || 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('candidate_notes')
        .delete()
        .eq('id', noteId)
        .eq('candidate_id', candidateId)
        .eq('author_id', userId);

      if (error) throw error;

      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert(`Erro ao excluir anotação: ${(error as Error)?.message || 'Tente novamente'}`);
    }
  };

  const contextLabel = contextLabels[context] || context;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-[var(--tf-warning)]" />
          <div className="flex-1">
            <CardTitle className="text-sm">
              Anotações - {contextLabel}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {notes.length} {notes.length === 1 ? 'anotação' : 'anotações'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-4">
        {/* New Note Input */}
        <div className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={placeholder || `Adicione suas anotações sobre ${contextLabel.toLowerCase()}...`}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-[var(--tf-accent)] focus:border-transparent 
                     bg-white resize-none transition-all"
            rows={3}
            disabled={saving}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || saving}
              size="sm"
              variant="primary"
            >
              {saving ? 'Salvando...' : 'Adicionar Anotação'}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-sm text-[var(--foreground-muted)]">
              Carregando anotações...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--foreground-muted)]">
              <StickyNote className="w-8 h-8 mx-auto mb-2 text-[var(--tf-gray-400)]" />
              <p className="font-medium">Nenhuma anotação ainda.</p>
              <p className="text-xs mt-1">
                Adicione observações importantes enquanto avalia o candidato.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-[var(--tf-gray-50)] rounded-lg p-3 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                {editingId === note.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded 
                               focus:outline-none focus:ring-2 focus:ring-[var(--tf-accent)] resize-none"
                      rows={3}
                      disabled={saving}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editText.trim() || saving}
                        size="xs"
                        variant="success"
                      >
                        <Save className="w-3 h-3" />
                        Salvar
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        size="xs"
                        variant="secondary"
                      >
                        <X className="w-3 h-3" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)]">
                          {note.authorName}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {formatDate(note.createdAt)}
                          {note.updatedAt && note.updatedAt !== note.createdAt && (
                            <span className="ml-1 text-[var(--tf-warning)]">(editado)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1 text-[var(--foreground-muted)] hover:text-[var(--tf-accent)] 
                                   hover:bg-white rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1 text-[var(--foreground-muted)] hover:text-[var(--tf-error)] 
                                   hover:bg-white rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                      {note.note}
                    </p>
                    <p className="text-[11px] text-[var(--foreground-muted)] mt-2">
                      Contexto: {contextLabels[note.context as keyof typeof contextLabels] || note.context}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
