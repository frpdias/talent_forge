'use client';

import { useState } from 'react';
import { Filter, X, Search, Calendar, Tag, User, Briefcase } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'tags';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onApplyFilters: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export function AdvancedFilters({ filters, onApplyFilters, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...filterValues, [filterId]: value };
    setFilterValues(newValues);
    
    // Count active filters
    const count = Object.values(newValues).filter(
      (v) => v !== null && v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
    setActiveFiltersCount(count);
  };

  const handleApply = () => {
    onApplyFilters(filterValues);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilterValues({});
    setActiveFiltersCount(0);
    onClearFilters();
  };

  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterValues[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || 'Digite...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {filter.options?.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    handleFilterChange(filter.id, newValues);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'daterange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, { ...value, start: e.target.value })
              }
              placeholder="De"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) =>
                handleFilterChange(filter.id, { ...value, end: e.target.value })
              }
              placeholder="Até"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'tags':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder="Digite tags separadas por vírgula"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-150 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros Avançados</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
