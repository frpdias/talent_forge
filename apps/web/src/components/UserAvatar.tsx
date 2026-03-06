'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'TF';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Se houver apenas uma palavra, pega as duas primeiras letras
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // Pega a primeira letra de cada palavra (máximo 2)
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const [initials, setInitials] = useState('TF');
  
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setInitials('TF');
          return;
        }
        
        // Tenta pegar o nome do user_metadata primeiro
        let fullName = user.user_metadata?.full_name;
        
        // Se não tiver no user_metadata, busca na tabela user_profiles
        if (!fullName) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();
          
          fullName = profile?.full_name;
        }
        
        setInitials(getInitials(fullName));
      } catch (error) {
        console.error('Error loading user name:', error);
        setInitials('TF');
      }
    };
    
    loadUserName();
  }, []);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
  };
  
  // Se o className contém 'bg-white', usa texto escuro, senão usa o gradiente padrão
  const isWhiteBg = className.includes('bg-white');
  const bgClass = isWhiteBg 
    ? 'bg-white text-[#141042]' 
    : 'bg-gradient-to-br from-[#141042] to-[#1e1860] text-white';
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded ${bgClass} flex items-center justify-center font-bold shrink-0 ${className.replace('bg-white', '')}`}
    >
      {initials}
    </div>
  );
}
