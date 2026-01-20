
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
        'logo': '1536/1024',
      }
    }
  }
}
