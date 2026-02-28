'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: Array<{
    action: string;
    endpoint: string;
  }>;
}

interface Report {
  title: string;
  content: string;
  sections: Array<{ heading: string; body: string }>;
  recommendations: string[];
  generated_at: string;
}

interface UsageStats {
  total_tokens: number;
  total_cost_usd: number;
  requests_count: number;
  by_feature: Record<string, { tokens: number; cost: number; count: number }>;
}

export default function AiChatPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    openai_configured: boolean;
    features_available: string[];
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const orgId = session?.user?.user_metadata?.org_id;

  useEffect(() => {
    if (orgId) {
      checkAiStatus();
      loadUsageStats();
    }
  }, [orgId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAiStatus = async () => {
    try {
      const res = await fetch('/api/php/ai/health', {
        headers: { 'x-org-id': orgId },
      });
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (error) {
      console.error('Failed to check AI status:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const res = await fetch(`/api/php/ai/usage?org_id=${orgId}`, {
        headers: { 'x-org-id': orgId },
      });
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/php/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': orgId,
        },
        body: JSON.stringify({
          org_id: orgId,
          message: inputMessage,
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Limite de requisições atingido. Aguarde alguns minutos.');
        }
        throw new Error('Falha ao enviar mensagem');
      }

      const data = await res.json();
      
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestedActions: data.suggested_actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/php/ai/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': orgId,
        },
        body: JSON.stringify({
          org_id: orgId,
          report_type: reportType,
          language: 'pt-BR',
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Limite de requisições atingido.');
        }
        throw new Error('Falha ao gerar relatório');
      }

      const data = await res.json();
      setReport(data);
      toast({
        title: 'Relatório gerado',
        description: 'O relatório foi gerado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o relatório',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const quickQuestions = [
    'Resuma o desempenho geral da organização',
    'Quais colaboradores estão em risco de burnout?',
    'Como está o TFCI médio por equipe?',
    'Identifique padrões nos dados de NR-1',
    'Quais ações prioritárias eu deveria tomar?',
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 AI Assistant</h1>
          <p className="text-muted-foreground">
            Converse com IA sobre seus dados de People Analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aiStatus?.openai_configured ? (
            <Badge variant="default" className="bg-green-600">
              ✓ OpenAI Conectado
            </Badge>
          ) : (
            <Badge variant="secondary">
              Modo Básico
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">💬 Chat</TabsTrigger>
          <TabsTrigger value="reports">📊 Relatórios</TabsTrigger>
          <TabsTrigger value="predictions">🔮 Predições</TabsTrigger>
          <TabsTrigger value="usage">📈 Uso</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-none border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle>Conversa</CardTitle>
                    <Button variant="outline" size="sm" onClick={newConversation}>
                      Nova Conversa
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                      <div className="text-6xl mb-4">🤖</div>
                      <p className="text-lg font-medium">Olá! Como posso ajudar?</p>
                      <p className="text-sm max-w-md mt-2">
                        Faça perguntas sobre desempenho, riscos psicossociais, 
                        métricas operacionais ou peça recomendações.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.suggestedActions.map((action, i) => (
                                <Button key={i} variant="outline" size="sm">
                                  {action.action}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="flex-none border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Digite sua pergunta..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                      Enviar
                    </Button>
                  </form>
                </div>
              </Card>
            </div>

            {/* Quick Questions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Perguntas Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 text-sm"
                      onClick={() => {
                        setInputMessage(q);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {[
              { type: 'summary', title: 'Resumo', icon: '📝', desc: 'Visão geral rápida' },
              { type: 'detailed', title: 'Detalhado', icon: '📋', desc: 'Análise completa' },
              { type: 'executive', title: 'Executivo', icon: '👔', desc: 'Para C-level' },
              { type: 'comparison', title: 'Comparativo', icon: '📊', desc: 'Entre períodos' },
            ].map((r) => (
              <div
                key={r.type}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => generateReport(r.type)}
              >
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-4xl mb-2">{r.icon}</div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {report && (
            <Card>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>
                  Gerado em {new Date(report.generated_at).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{report.content}</div>
                </div>
                {report.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Recomendações:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🔄 Predição de Turnover</CardTitle>
                <CardDescription>
                  Identifique colaboradores com risco de saída
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await fetch('/api/php/ai/predict-turnover', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-org-id': orgId,
                        },
                        body: JSON.stringify({ org_id: orgId }),
                      });
                      const data = await res.json();
                      console.log('Turnover predictions:', data);
                      toast({
                        title: 'Análise concluída',
                        description: `${data.predictions_count} colaboradores analisados`,
                      });
                    } catch (error) {
                      toast({ title: 'Erro', variant: 'destructive' });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  Analisar Turnover
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📈 Forecast de Performance</CardTitle>
                <CardDescription>
                  Projete métricas para os próximos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await fetch('/api/php/ai/forecast-performance', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-org-id': orgId,
                        },
                        body: JSON.stringify({ org_id: orgId, months_ahead: 3 }),
                      });
                      const data = await res.json();
                      console.log('Performance forecast:', data);
                      toast({
                        title: 'Previsão gerada',
                        description: `${data.forecasts_count} módulos analisados`,
                      });
                    } catch (error) {
                      toast({ title: 'Erro', variant: 'destructive' });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  Gerar Forecast
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>💡 Recomendações Inteligentes</CardTitle>
                <CardDescription>
                  Defina um objetivo e receba recomendações priorizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  onValueChange={async (goal) => {
                    setIsLoading(true);
                    try {
                      const res = await fetch('/api/php/ai/smart-recommendations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-org-id': orgId,
                        },
                        body: JSON.stringify({ org_id: orgId, goal }),
                      });
                      const data = await res.json();
                      console.log('Smart recommendations:', data);
                      toast({
                        title: 'Recomendações geradas',
                        description: `${data.recommendations?.length || 0} ações sugeridas`,
                      });
                    } catch (error) {
                      toast({ title: 'Erro', variant: 'destructive' });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um objetivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reduzir burnout em 30%">
                      🧘 Reduzir burnout em 30%
                    </SelectItem>
                    <SelectItem value="Aumentar score TFCI em 20%">
                      📈 Aumentar score TFCI em 20%
                    </SelectItem>
                    <SelectItem value="Melhorar Quality Score COPC">
                      ⭐ Melhorar Quality Score COPC
                    </SelectItem>
                    <SelectItem value="Reduzir turnover voluntário">
                      👥 Reduzir turnover voluntário
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Total de Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.total_tokens?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Custo Estimado (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${usageStats?.total_cost_usd?.toFixed(4) || '0.00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Requisições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.requests_count || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {usageStats?.by_feature && Object.keys(usageStats.by_feature).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uso por Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(usageStats.by_feature).map(([feature, stats]) => (
                    <div
                      key={feature}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {feature.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats.count} requisições
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {stats.tokens.toLocaleString()} tokens
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${stats.cost.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Features Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {aiStatus?.features_available?.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
