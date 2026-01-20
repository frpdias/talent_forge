# Guia de Uso - Logo FARTECH TalentForge Otimizada

## 📊 Informações da Logo

- **Dimensões Originais**: 1536x1024px
- **Aspect Ratio**: 1.50:1
- **Formato**: PNG otimizado com transparência

## 🎨 Versões Disponíveis

Todas as versões mantêm a proporcionalidade original (1.50:1):

### NAVBAR-MOBILE
- Dimensões: 216x144px
- Arquivo: `logo-navbar-mobile.png`
- Uso: ```tsx <img src="/logos/logo-navbar-mobile.png" alt="TalentForge" className="h-auto w-auto" /> ```

### NAVBAR-DESKTOP
- Dimensões: 360x240px
- Arquivo: `logo-navbar-desktop.png`
- Uso: ```tsx <img src="/logos/logo-navbar-desktop.png" alt="TalentForge" className="h-auto w-auto" /> ```

### SIDEBAR
- Dimensões: 288x192px
- Arquivo: `logo-sidebar.png`
- Uso: ```tsx <img src="/logos/logo-sidebar.png" alt="TalentForge" className="h-auto w-auto" /> ```

### AUTH-MOBILE
- Dimensões: 216x144px
- Arquivo: `logo-auth-mobile.png`
- Uso: ```tsx <img src="/logos/logo-auth-mobile.png" alt="TalentForge" className="h-auto w-auto" /> ```

### AUTH-DESKTOP
- Dimensões: 360x240px
- Arquivo: `logo-auth-desktop.png`
- Uso: ```tsx <img src="/logos/logo-auth-desktop.png" alt="TalentForge" className="h-auto w-auto" /> ```

### FOOTER
- Dimensões: 288x192px
- Arquivo: `logo-footer.png`
- Uso: ```tsx <img src="/logos/logo-footer.png" alt="TalentForge" className="h-auto w-auto" /> ```

### ORIGINAL
- Dimensões: 1536x1024px
- Arquivo: `logo-original.png`
- Uso: ```tsx <img src="/logos/logo-original.png" alt="TalentForge" className="h-auto w-auto" /> ```


## 💡 Recomendações de Uso

### Navbar Público
```tsx
<img 
  src="/logos/logo-navbar-desktop.png" 
  alt="FARTECH TalentForge" 
  className="h-auto w-auto max-h-60"
/>
```

### Sidebars (Dashboard/Admin/Candidate)
```tsx
<img 
  src="/logos/logo-sidebar.png" 
  alt="FARTECH TalentForge" 
  className="h-auto w-auto max-h-48"
/>
```

### Auth Pages (Desktop)
```tsx
<img 
  src="/logos/logo-auth-desktop.png" 
  alt="FARTECH TalentForge" 
  className="h-auto w-auto max-h-60 brightness-0 invert"
/>
```

### Auth Pages (Mobile)
```tsx
<img 
  src="/logos/logo-auth-mobile.png" 
  alt="FARTECH TalentForge" 
  className="h-auto w-auto max-h-36 sm:max-h-48"
/>
```

### Footer
```tsx
<img 
  src="/logos/logo-footer.png" 
  alt="FARTECH TalentForge" 
  className="h-auto w-auto max-h-48 brightness-0 invert"
/>
```

## 🔧 Tailwind CSS Classes

Para manter a proporcionalidade automaticamente:

```tsx
// Approach 1: Altura fixa, largura automática
className="h-48 w-auto"

// Approach 2: Container com max-height
className="max-h-48 w-auto h-auto"

// Approach 3: Responsive
className="h-36 sm:h-48 lg:h-60 w-auto"
```

## ⚠️ Importante

1. **Sempre use `w-auto`** para manter a proporcionalidade
2. **Use `h-auto` com `max-h-*`** para limites flexíveis
3. **Para inversão de cores** (fundos escuros): adicione `brightness-0 invert`
4. **Para responsividade**: combine classes sm: md: lg:

## 📱 Breakpoints Sugeridos

- **Mobile (< 640px)**: h-36 (144px)
- **Tablet (640px - 1024px)**: h-48 (192px)
- **Desktop (> 1024px)**: h-60 (240px)

---

Gerado automaticamente por optimize-logo.py
