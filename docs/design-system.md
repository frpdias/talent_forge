# Design System - Talent Forge

## Tipografia e Estilo

### Fonte Principal
**Montserrat** - Google Font
- Família moderna, corporativa e digital
- Alinhada ao branding tech / RH SaaS / HR Tech
- Pesos utilizados: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Logotipo "TALENT FORGE"

#### Características
- Letras em **CAIXA ALTA**
- Traços retos, limpos e geométricos
- Proporções modernas e corporativas

#### Pesos Tipográficos
- **TALENT** → Montserrat SemiBold (`font-semibold`)
- **FORGE** → Montserrat Bold (`font-bold`)

## Paleta de Cores

### Cores Primárias - Logotipo

#### TALENT - Azul Corporativo
- **HEX:** `#1F4ED8`
- **RGB:** 31, 78, 216
- **Tailwind:** `text-[#1F4ED8]`
- **Sensação:** Confiança, tecnologia, profissionalismo

#### FORGE - Laranja Energia
- **HEX:** `#F97316`
- **RGB:** 249, 115, 22
- **Tailwind:** `text-[#F97316]`
- **Sensação:** Transformação, força, criação de talentos

### Cores Secundárias

#### Cinza Neutro - Texto Institucional
- **HEX:** `#6B7280`
- **RGB:** 107, 114, 128
- **Tailwind:** `text-[#6B7280]`
- **Uso:** RECRUTAMENTO & RH, textos corporativos
- **Fonte:** Montserrat Regular
- **Espaçamento:** Letter-spacing levemente ampliado (`tracking-wider`)
- **Sensação:** Equilíbrio, seriedade, institucional

## Implementação

### Tamanhos do Logotipo

#### Desktop
```tsx
<span className="text-[#1F4ED8] font-semibold text-2xl tracking-tight">TALENT</span>
<span className="text-[#F97316] font-bold text-2xl tracking-wider">FORGE</span>
```

#### Mobile / Sidebar
```tsx
<span className="text-[#1F4ED8] font-semibold text-xl tracking-tight">TALENT</span>
<span className="text-[#F97316] font-bold text-xl tracking-wider">FORGE</span>
```

#### Navegação Compacta
```tsx
<span className="text-[#1F4ED8] font-semibold text-base tracking-tight">TALENT</span>
<span className="text-[#F97316] font-bold text-base tracking-wider">FORGE</span>
```

### Letter-spacing
- **TALENT:** `tracking-tight` (reduzido para compactação)
- **FORGE:** `tracking-wider` (expandido para força/presença)

## Arquivos Atualizados
1. [src/app/layout.tsx](../apps/web/src/app/layout.tsx) - Fonte Montserrat configurada
2. [src/app/globals.css](../apps/web/src/app/globals.css) - Variável CSS da fonte
3. [src/app/(public)/page.tsx](../apps/web/src/app/(public)/page.tsx)
4. [src/app/(dashboard)/dashboard/layout.tsx](../apps/web/src/app/(dashboard)/dashboard/layout.tsx)
5. [src/app/(admin)/admin/layout.tsx](../apps/web/src/app/(admin)/admin/layout.tsx)
6. [src/app/(candidate)/candidate/layout.tsx](../apps/web/src/app/(candidate)/candidate/layout.tsx)
7. [src/app/(auth)/login/page.tsx](../apps/web/src/app/(auth)/login/page.tsx)
8. [src/app/(auth)/register/page.tsx](../apps/web/src/app/(auth)/register/page.tsx)

## Guidelines de Uso

### ✅ Correto
- Sempre usar cores oficiais: `#1F4ED8` e `#F97316`
- Manter pesos: SemiBold (TALENT) e Bold (FORGE)
- Usar fonte Montserrat em todo o branding
- Manter letter-spacing: `tight` para TALENT, `wider` para FORGE

### ❌ Evitar
- Alterar cores ou tons
- Inverter pesos tipográficos
- Usar outras fontes para o logotipo
- Adicionar efeitos ou sombras no logotipo principal
- Usar minúsculas no logotipo

## Acessibilidade

### Contraste de Cores
- **TALENT (#1F4ED8)** sobre fundo branco: ✅ WCAG AA/AAA
- **FORGE (#F97316)** sobre fundo branco: ✅ WCAG AA
- Ambas as cores sobre fundo escuro (#141042): ✅ Alto contraste

### Legibilidade
- Tamanhos mínimos respeitados (16px+)
- Pesos adequados para leitura digital
- Letter-spacing otimizado para clareza
