'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Input, Avatar } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { candidatesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  tags?: string[];
  createdAt: string;
  applicationCount?: number;
}

export default function CandidatesPage() {
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentOrg?.id && session?.access_token) {
      loadCandidates();
    }
  }, [currentOrg?.id, session?.access_token, search]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const params: { search?: string } = {};
      if (search) params.search = search;
      
      const data = await candidatesApi.list(session!.access_token, currentOrg!.id, params);
      setCandidates((data as any).data || []);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Candidatos"
        subtitle={`${candidates.length} candidatos cadastrados`}
        actions={
          <Link href="/candidates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Candidato
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por nome, email ou tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum candidato encontrado</h3>
              <p className="text-gray-500 mb-4">Adicione candidatos para começar a gerenciar seu pipeline.</p>
              <Link href="/candidates/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Candidato
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={candidate.name} size="lg" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          {candidate.tags && candidate.tags.length > 0 && (
                            <div className="flex gap-1">
                              {candidate.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="default" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {candidate.headline && (
                          <p className="text-sm text-gray-600 mt-0.5">{candidate.headline}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {candidate.email}
                          </span>
                          {candidate.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {candidate.phone}
                            </span>
                          )}
                          {candidate.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {candidate.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Briefcase className="h-4 w-4" />
                          <span>{candidate.applicationCount || 0} aplicações</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Cadastrado em {formatDate(candidate.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
