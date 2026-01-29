# Análise: Pasta (dashboard) vs (recruiter)

## Situação Detectada

Existem 2 pastas com estrutura similar:
- `apps/web/src/app/(dashboard)/dashboard/` (LEGADO - última modificação 25 Jan)
- `apps/web/src/app/(recruiter)/dashboard/` (ATIVO - última modificação 27 Jan)

## Evidências

### Datas de Modificação
- **(dashboard)**: Última modificação 25/01 - 15:14
- **(recruiter)**: Última modificação 27/01 - 21:20

### Tamanho dos Arquivos Principais
- `(dashboard)/dashboard/page.tsx`: 725 linhas
- `(recruiter)/dashboard/page.tsx`: 763 linhas (mais recente e maior)

### Histórico Git
Ambas aparecem no mesmo commit:
```
446001c feat: adiciona novas rotas de autenticação e dashboard
```

## Conclusão

**Pasta `(dashboard)` é LEGADO**:
1. Última modificação há 4 dias (vs 2 dias do recruiter)
2. Arquivo principal com menos linhas (desatualizado)
3. Arquitetura Canônica define apenas `(recruiter)` como padrão oficial

## Ação Recomendada

**NÃO deletar imediatamente** - pode haver links ou referências em código.

**Plano Seguro**:
1. ✅ Criar backup da pasta
2. ✅ Buscar referências no código
3. ✅ Se sem referências, renomear para `.backup`
4. ✅ Testar aplicação
5. ✅ Após 1 sprint sem problemas, deletar definitivamente

## Status

PENDENTE - Aguardando busca de referências no código.
