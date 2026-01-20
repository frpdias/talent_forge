'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CboResult {
  code: string;
  title: string;
  avg_salary_min?: number;
  avg_salary_max?: number;
}

interface CboSelectorProps {
  value?: string;
  onChange: (code: string, title: string, salaryMatch?: { min: number, max: number }) => void;
  className?: string;
  placeholder?: string;
}

export function CboSelector({ value, onChange, className, placeholder = "Buscar ocupação (CBO)..." }: CboSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CboResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Carregar título se já tiver valor inicial (edição)
  useEffect(() => {
    if (value && !selectedTitle) {
      supabase.from('ref_cbo').select('title').eq('code', value).single()
        .then(({ data }) => {
          if (data) {
            setSelectedTitle(`${data.title} (${value})`);
            setQuery(`${data.title} (${value})`);
          }
        });
    }
  }, [value]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca com debounce
  useEffect(() => {
    if (!isOpen) return; // Não buscar se estiver fechado (ex: apenas exibindo valor selecionado)

    const searchCbo = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Busca usando o índice Full Text Search
        // Usamos :* para prefix search (ex: "Desenvol" -> "Desenvolvedor")
        const cleanQuery = query.trim().split(' ').join(' & ');
        const { data, error } = await supabase
          .from('ref_cbo')
          .select('code, title, avg_salary_min, avg_salary_max')
          .textSearch('fts_vector', `${cleanQuery}:*`) 
          .limit(10);
        
        if (data) setResults(data);
      } catch (err) {
        console.error("Erro na busca CBO:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(searchCbo, 300);
    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  const handleSelect = (item: CboResult) => {
    const display = `${item.title} (${item.code})`;
    setQuery(display);
    setSelectedTitle(display);
    
    // Passar infos de salário se disponíveis
    const salary = (item.avg_salary_min && item.avg_salary_max) 
      ? { min: item.avg_salary_min, max: item.avg_salary_max } 
      : undefined;

    onChange(item.code, item.title, salary);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
                onChange('', ''); // Limpar seleção
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-8 text-black"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 shadow-lg">
          <ul className="p-1">
            {results.map((item) => (
              <li
                key={item.code}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 rounded-sm"
                onClick={() => handleSelect(item)}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">CBO: {item.code}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
         <Card className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg p-4 text-center text-sm text-gray-500">
            Nenhuma ocupação encontrada.
         </Card>
      )}
    </div>
  );
}
