'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, X, Plus } from 'lucide-react';

interface Interview {
  id: string;
  candidateName: string;
  jobTitle: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: 'presencial' | 'video' | 'phone';
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface InterviewSchedulerProps {
  candidateId?: string;
  jobId?: string;
  onSchedule?: (interview: Partial<Interview>) => void;
}

export function InterviewScheduler({ candidateId, jobId, onSchedule }: InterviewSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    location: '',
    type: 'video' as const,
    interviewers: [] as string[],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule?.(formData);
    setIsOpen(false);
    
    // Reset form
    setFormData({
      date: '',
      time: '',
      duration: 60,
      location: '',
      type: 'video',
      interviewers: [],
      notes: '',
    });
  };

  const addToGoogleCalendar = (interview: Partial<Interview>) => {
    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', `Entrevista - ${interview.candidateName || 'Candidato'}`);
    googleCalendarUrl.searchParams.set('dates', `${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    googleCalendarUrl.searchParams.set('details', formData.notes || 'Entrevista agendada via Talent Forge');
    googleCalendarUrl.searchParams.set('location', formData.location);

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <CalendarIcon className="w-4 h-4" />
        <span>Agendar Entrevista</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Agendar Entrevista</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Duração */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (minutos)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1 hora e 30 minutos</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Entrevista
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'video', label: 'Vídeo', icon: '📹' },
                      { value: 'presencial', label: 'Presencial', icon: '🏢' },
                      { value: 'phone', label: 'Telefone', icon: '📞' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value as any })}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          formData.type === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Local / Link
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder={
                      formData.type === 'video'
                        ? 'https://meet.google.com/...'
                        : formData.type === 'phone'
                        ? 'Número de telefone'
                        : 'Endereço'
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Informações adicionais sobre a entrevista..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Agendar
                  </button>
                  <button
                    type="button"
                    onClick={() => addToGoogleCalendar(formData)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    + Google Calendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
