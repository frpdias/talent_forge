#!/usr/bin/env python3
"""
Script para otimizar e gerar versões responsivas da logo FARTECH TalentForge
Baixa a logo do Supabase, analisa dimensões e cria versões otimizadas
"""

import requests
from PIL import Image, ImageDraw, ImageFont
import io
import os
from pathlib import Path

# URL da logo no Supabase
LOGO_URL = "https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/TALENT%20FORGE%201.png"

# Diretório de saída
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "logos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def download_logo():
    """Baixa a logo do Supabase"""
    print(f"📥 Baixando logo de: {LOGO_URL}")
    response = requests.get(LOGO_URL)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content))

def analyze_logo(img):
    """Analisa as dimensões e características da logo"""
    width, height = img.size
    aspect_ratio = width / height
    
    print(f"\n📊 Análise da Logo Original:")
    print(f"   Dimensões: {width}x{height}px")
    print(f"   Aspect Ratio: {aspect_ratio:.2f}:1")
    print(f"   Modo: {img.mode}")
    print(f"   Formato: {img.format}")
    
    return {
        'width': width,
        'height': height,
        'aspect_ratio': aspect_ratio,
        'mode': img.mode
    }

def create_responsive_versions(img, info):
    """Cria versões responsivas da logo mantendo a proporcionalidade"""
    
    # Definir tamanhos baseados em altura (Tailwind classes)
    sizes = {
        'navbar-mobile': 144,      # h-36 (36 * 4px = 144px)
        'navbar-desktop': 240,     # h-60 (60 * 4px = 240px)
        'sidebar': 192,            # h-48 (48 * 4px = 192px)
        'auth-mobile': 144,        # h-36 (36 * 4px = 144px)
        'auth-desktop': 240,       # h-60 (60 * 4px = 240px)
        'footer': 192,             # h-48 (48 * 4px = 192px)
        'original': info['height'] # Original para referência
    }
    
    print(f"\n🎨 Gerando versões otimizadas:")
    
    versions = {}
    
    for name, target_height in sizes.items():
        # Calcular largura proporcional
        target_width = int(target_height * info['aspect_ratio'])
        
        # Redimensionar mantendo qualidade
        resized = img.resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS  # Melhor qualidade para redimensionamento
        )
        
        # Salvar versão otimizada
        output_path = OUTPUT_DIR / f"logo-{name}.png"
        resized.save(output_path, 'PNG', optimize=True, quality=95)
        
        print(f"   ✅ {name}: {target_width}x{target_height}px → {output_path.name}")
        
        versions[name] = {
            'path': output_path,
            'width': target_width,
            'height': target_height
        }
    
    return versions

def generate_svg_template(info):
    """Gera um template SVG responsivo baseado nas dimensões"""
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 {info['width']} {info['height']}"
  preserveAspectRatio="xMidYMid meet"
  class="logo-responsive"
>
  <style>
    .logo-responsive {{
      width: auto;
      height: 100%;
      max-width: 100%;
    }}
  </style>
  
  <!-- A imagem PNG será embedada aqui -->
  <image 
    href="logo-original.png" 
    width="{info['width']}" 
    height="{info['height']}"
    preserveAspectRatio="xMidYMid meet"
  />
</svg>
'''
    
    svg_path = OUTPUT_DIR / "logo-responsive.svg"
    svg_path.write_text(svg_content)
    print(f"\n📐 Template SVG gerado: {svg_path.name}")
    
    return svg_path

def generate_tailwind_config(versions):
    """Gera configurações do Tailwind CSS para as logos"""
    
    config = """
// Adicione ao seu tailwind.config.ts

export default {
  theme: {
    extend: {
      height: {
        // Logo Heights - Otimizadas para cada contexto
        'logo-navbar-mobile': '144px',    // 36 * 4px
        'logo-navbar-desktop': '240px',   // 60 * 4px
        'logo-sidebar': '192px',          // 48 * 4px
        'logo-auth-mobile': '144px',      // 36 * 4px
        'logo-auth-desktop': '240px',     // 60 * 4px
        'logo-footer': '192px',           // 48 * 4px
      },
      // Aspect ratio da logo
      aspectRatio: {
        'logo': '""" + f"{versions['original']['width']}/{versions['original']['height']}" + """',
      }
    }
  }
}
"""
    
    config_path = OUTPUT_DIR / "tailwind-logo-config.js"
    config_path.write_text(config)
    print(f"\n⚙️  Config Tailwind gerada: {config_path.name}")
    
    return config_path

def generate_usage_guide(versions, info):
    """Gera guia de uso para as logos otimizadas"""
    
    guide = f"""# Guia de Uso - Logo FARTECH TalentForge Otimizada

## 📊 Informações da Logo

- **Dimensões Originais**: {info['width']}x{info['height']}px
- **Aspect Ratio**: {info['aspect_ratio']:.2f}:1
- **Formato**: PNG otimizado com transparência

## 🎨 Versões Disponíveis

Todas as versões mantêm a proporcionalidade original ({info['aspect_ratio']:.2f}:1):

"""
    
    for name, data in versions.items():
        guide += f"### {name.upper()}\n"
        guide += f"- Dimensões: {data['width']}x{data['height']}px\n"
        guide += f"- Arquivo: `{data['path'].name}`\n"
        guide += f"- Uso: ```tsx <img src=\"/logos/{data['path'].name}\" alt=\"TalentForge\" className=\"h-auto w-auto\" /> ```\n\n"
    
    guide += """
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
"""
    
    guide_path = OUTPUT_DIR / "USAGE_GUIDE.md"
    guide_path.write_text(guide)
    print(f"\n📖 Guia de uso gerado: {guide_path.name}")
    
    return guide_path

def main():
    """Função principal"""
    print("🚀 FARTECH TalentForge - Logo Optimization Tool\n")
    print("=" * 60)
    
    try:
        # 1. Baixar logo
        img = download_logo()
        
        # 2. Analisar logo
        info = analyze_logo(img)
        
        # 3. Criar versões responsivas
        versions = create_responsive_versions(img, info)
        
        # 4. Gerar template SVG
        generate_svg_template(info)
        
        # 5. Gerar config Tailwind
        generate_tailwind_config(versions)
        
        # 6. Gerar guia de uso
        generate_usage_guide(versions, info)
        
        print("\n" + "=" * 60)
        print("✨ Otimização concluída com sucesso!")
        print(f"\n📁 Arquivos salvos em: {OUTPUT_DIR}")
        print(f"\n💡 Próximo passo: Atualize os componentes para usar as versões otimizadas")
        print(f"   Consulte: {OUTPUT_DIR / 'USAGE_GUIDE.md'}")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        raise

if __name__ == "__main__":
    main()
