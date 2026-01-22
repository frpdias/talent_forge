'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Briefcase, GraduationCap, FileText, Upload, 
  ChevronRight, ChevronLeft, Check, Calendar, MapPin,
  Building2, DollarSign, Clock, Plus, X, Loader2
} from 'lucide-react';

type EmploymentType = 'CLT' | 'PJ' | 'Estágio' | 'Freelancer' | 'Cooperado';
type SeniorityLevel = 'estagiario' | 'junior' | 'pleno' | 'senior' | 'lead' | 'gerente' | 'diretor' | 'c-level';
type DegreeLevel = 'ensino_fundamental' | 'ensino_medio' | 'tecnico' | 'graduacao' | 'pos_graduacao' | 'mestrado' | 'doutorado' | 'mba';

interface PersonalData {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  state: string;
}

interface ProfessionalData {
  currentTitle: string;
  areaOfExpertise: string;
  seniorityLevel: SeniorityLevel | '';
  salaryExpectation: string;
  employmentTypes: EmploymentType[];
}

interface Education {
  id: string;
  degreeLevel: DegreeLevel | '';
  courseName: string;
  institution: string;
  startYear: string;
  endYear: string;
  isCurrent: boolean;
}

interface Experience {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

const steps = [
  { id: 1, title: 'Dados Pessoais', icon: User },
  { id: 2, title: 'Dados Profissionais', icon: Briefcase },
  { id: 3, title: 'Formação Acadêmica', icon: GraduationCap },
  { id: 4, title: 'Experiências', icon: FileText },
  { id: 5, title: 'Currículo', icon: Upload },
];

const seniorityOptions: { value: SeniorityLevel; label: string }[] = [
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'junior', label: 'Júnior' },
  { value: 'pleno', label: 'Pleno' },
  { value: 'senior', label: 'Sênior' },
  { value: 'lead', label: 'Tech Lead' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'c-level', label: 'C-Level' },
];

const degreeOptions: { value: DegreeLevel; label: string }[] = [
  { value: 'ensino_fundamental', label: 'Ensino Fundamental' },
  { value: 'ensino_medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'graduacao', label: 'Graduação' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
  { value: 'mba', label: 'MBA' },
];

const employmentTypeOptions: EmploymentType[] = ['CLT', 'PJ', 'Estágio', 'Freelancer', 'Cooperado'];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CandidateOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form data
  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    state: '',
  });

  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    currentTitle: '',
    areaOfExpertise: '',
    seniorityLevel: '',
    salaryExpectation: '',
    employmentTypes: [],
  });

  const [educations, setEducations] = useState<Education[]>([
    { id: '1', degreeLevel: '', courseName: '', institution: '', startYear: '', endYear: '', isCurrent: false }
  ]);

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', companyName: '', jobTitle: '', startDate: '', endDate: '', isCurrent: false, description: '' }
  ]);

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);
    setPersonalData(prev => ({ ...prev, email: user.email || '' }));

    const profileEmail = (user.email || '').trim().toLowerCase();

    // Check if candidate profile already exists (user_id or email)
    const { data: profileList, error: profileLookupError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .or(profileEmail ? `user_id.eq.${user.id},email.eq.${profileEmail}` : `user_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileLookupError) {
      console.error('Erro ao buscar profile:', profileLookupError);
    }

    const profile = (profileList && profileList.length > 0) ? profileList[0] : null;

    if (profile) {
      setProfileId(profile.id);

      // Load saved data
      setCurrentStep(profile.onboarding_step || 1);
      setPersonalData({
        fullName: profile.full_name || '',
        cpf: profile.cpf || '',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        birthDate: profile.birth_date || '',
        city: profile.city || '',
        state: profile.state || '',
      });
      
      setProfessionalData({
        currentTitle: profile.current_title || '',
        areaOfExpertise: profile.area_of_expertise || '',
        seniorityLevel: profile.seniority_level || '',
        salaryExpectation: profile.salary_expectation ? profile.salary_expectation.toString() : '',
        employmentTypes: Array.isArray(profile.employment_type) ? profile.employment_type : [],
      });

      // Load education
      const { data: eduData } = await supabase
        .from('candidate_education')
        .select('*')
        .eq('candidate_profile_id', profile.id);

      if (eduData && eduData.length > 0) {
        setEducations(eduData.map(edu => ({
          id: edu.id || Date.now().toString(),
          degreeLevel: edu.degree_level || '',
          courseName: edu.course_name || '',
          institution: edu.institution || '',
          startYear: edu.start_year ? edu.start_year.toString() : '',
          endYear: edu.end_year ? edu.end_year.toString() : '',
          isCurrent: edu.is_current || false,
        })));
      }

      // Load experience
      const { data: expData } = await supabase
        .from('candidate_experience')
        .select('*')
        .eq('candidate_profile_id', profile.id);

      if (expData && expData.length > 0) {
        setExperiences(expData.map(exp => ({
          id: exp.id || Date.now().toString(),
          companyName: exp.company_name || '',
          jobTitle: exp.job_title || '',
          startDate: exp.start_date ? exp.start_date.substring(0, 7) : '',
          endDate: exp.end_date ? exp.end_date.substring(0, 7) : '',
          isCurrent: exp.is_current || false,
          description: exp.description || '',
        })));
      }
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para número e formata
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return (parseInt(numbers) / 100).toFixed(2);
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!personalData.fullName.trim()) {
          setError('Nome completo é obrigatório');
          return false;
        }
        if (!personalData.cpf || !validateCPF(personalData.cpf)) {
          setError('CPF inválido');
          return false;
        }
        if (!personalData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
          setError('Email inválido');
          return false;
        }
        if (!personalData.phone.trim()) {
          setError('Telefone é obrigatório');
          return false;
        }
        if (!personalData.birthDate) {
          setError('Data de nascimento é obrigatória');
          return false;
        }
        if (!personalData.city.trim() || !personalData.state) {
          setError('Cidade e estado são obrigatórios');
          return false;
        }
        break;

      case 2:
        if (!professionalData.currentTitle.trim()) {
          setError('Cargo atual é obrigatório');
          return false;
        }
        if (!professionalData.areaOfExpertise.trim()) {
          setError('Área de atuação é obrigatória');
          return false;
        }
        if (!professionalData.seniorityLevel) {
          setError('Nível de senioridade é obrigatório');
          return false;
        }
        if (professionalData.employmentTypes.length === 0) {
          setError('Selecione pelo menos um tipo de contratação');
          return false;
        }
        break;

      case 3:
        const validEducations = educations.filter(edu => 
          edu.degreeLevel && edu.courseName.trim() && edu.institution.trim()
        );
        if (validEducations.length === 0) {
          setError('Adicione pelo menos uma formação acadêmica');
          return false;
        }
        break;

      case 4:
        const validExperiences = experiences.filter(exp => 
          exp.companyName.trim() && exp.jobTitle.trim() && exp.startDate
        );
        if (validExperiences.length === 0) {
          setError('Adicione pelo menos uma experiência profissional');
          return false;
        }
        break;
    }

    setError('');
    return true;
  };

  const saveStep = async () => {
    if (!userId) return;

    setLoading(true);
    const supabase = createClient();
    const resolvedEmail = (personalData.email || '').trim().toLowerCase();

    try {
      let currentProfileId = profileId;

      // Create or update profile
      if (!profileId) {
        const { data: existingProfiles, error: existingProfilesError } = await supabase
          .from('candidate_profiles')
          .select('id')
          .or(resolvedEmail ? `user_id.eq.${userId},email.eq.${resolvedEmail}` : `user_id.eq.${userId}`)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingProfilesError) {
          console.error('Erro ao localizar profile existente:', existingProfilesError);
        }

        const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;

        if (existingProfile) {
          currentProfileId = existingProfile.id;
          setProfileId(existingProfile.id);
        } else {
          const { data: newProfile, error: profileError } = await supabase
            .from('candidate_profiles')
            .insert({
              user_id: userId,
              onboarding_step: currentStep,
              onboarding_completed: false,
              email: resolvedEmail || null,
            })
            .select()
            .single();

          if (profileError) throw profileError;
          currentProfileId = newProfile.id;
          setProfileId(newProfile.id);
        }
      }

      // Save based on current step
      if (currentStep === 1) {
        const { error } = await supabase
          .from('candidate_profiles')
          .update({
            full_name: personalData.fullName,
            cpf: personalData.cpf.replace(/\D/g, ''),
            email: personalData.email,
            phone: personalData.phone,
            birth_date: personalData.birthDate,
            city: personalData.city,
            state: personalData.state,
            onboarding_step: 2,
          })
          .eq('id', currentProfileId);

        if (error) throw error;
      }

      if (currentStep === 2) {
        const { error } = await supabase
          .from('candidate_profiles')
          .update({
            current_title: professionalData.currentTitle,
            area_of_expertise: professionalData.areaOfExpertise,
            seniority_level: professionalData.seniorityLevel,
            salary_expectation: professionalData.salaryExpectation ? parseFloat(professionalData.salaryExpectation) : null,
            employment_type: professionalData.employmentTypes,
            onboarding_step: 3,
          })
          .eq('id', currentProfileId);

        if (error) throw error;
      }

      if (currentStep === 3) {
        const validEducations = educations.filter(edu => 
          edu.degreeLevel && edu.courseName.trim() && edu.institution.trim()
        );

        // Delete existing education
        const { error: deleteEduError } = await supabase
          .from('candidate_education')
          .delete()
          .eq('candidate_profile_id', currentProfileId);
        if (deleteEduError) throw deleteEduError;

        // Insert new education
        if (validEducations.length > 0) {
          const { error } = await supabase
            .from('candidate_education')
            .insert(validEducations.map(edu => ({
              candidate_profile_id: currentProfileId,
              degree_level: edu.degreeLevel,
              course_name: edu.courseName,
              institution: edu.institution,
              start_year: edu.startYear ? parseInt(edu.startYear) : null,
              end_year: edu.endYear ? parseInt(edu.endYear) : null,
              is_current: edu.isCurrent,
            })));

          if (error) throw error;
        }

        await supabase
          .from('candidate_profiles')
          .update({ onboarding_step: 4 })
          .eq('id', currentProfileId);
      }

      if (currentStep === 4) {
        const validExperiences = experiences.filter(exp => 
          exp.companyName.trim() && exp.jobTitle.trim() && exp.startDate
        );

        // Delete existing experience
        const { error: deleteExpError } = await supabase
          .from('candidate_experience')
          .delete()
          .eq('candidate_profile_id', currentProfileId);
        if (deleteExpError) throw deleteExpError;

        // Insert new experience
        if (validExperiences.length > 0) {
          const { error } = await supabase
            .from('candidate_experience')
            .insert(validExperiences.map(exp => ({
              candidate_profile_id: currentProfileId,
              company_name: exp.companyName,
              job_title: exp.jobTitle,
              start_date: exp.startDate.includes('-') ? `${exp.startDate}-01` : exp.startDate,
              end_date: exp.endDate ? (exp.endDate.includes('-') ? `${exp.endDate}-01` : exp.endDate) : null,
              is_current: exp.isCurrent,
              description: exp.description,
            })));

          if (error) throw error;
        }

        await supabase
          .from('candidate_profiles')
          .update({ onboarding_step: 5 })
          .eq('id', currentProfileId);
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Save error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        raw: err,
      });
      // Don't show error to user if table doesn't exist (migration not applied yet)
      if (!err?.message?.includes('candidate_profiles')) {
        setError(err?.message || err?.details || 'Erro ao salvar dados');
      }
      setLoading(false);
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    // Try to save, but continue even if it fails (for when migration is not yet applied)
    try {
      const saved = await saveStep();
      if (!saved) {
        return;
      }
    } catch (err) {
      console.warn('Save failed, but continuing to next step:', err);
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    console.log('🚀 handleFinish iniciado', { profileId, userId });
    
    if (!profileId) {
      setError('Perfil não encontrado. Tente refazer o cadastro.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Upload resume if provided
      let resumeUrl = '';
      let resumeFilename = '';

      if (resumeFile) {
        console.log('📄 Tentando upload de currículo...', resumeFile.name);
        try {
          // Validate file size (5MB max)
          const maxSize = 5 * 1024 * 1024; // 5MB in bytes
          if (resumeFile.size > maxSize) {
            throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
          }

          // Validate file type
          const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          if (!allowedTypes.includes(resumeFile.type)) {
            throw new Error('Formato não permitido. Use PDF ou DOC/DOCX');
          }

          const fileExt = resumeFile.name.split('.').pop();
          const fileName = `${userId}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, resumeFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            // Continue without resume if upload fails
            console.warn('⚠️ Continuando sem upload de currículo');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('resumes')
              .getPublicUrl(fileName);

            resumeUrl = publicUrl;
            resumeFilename = resumeFile.name;
            console.log('✅ Upload concluído:', fileName);
          }
        } catch (uploadErr: any) {
          console.error('❌ Resume upload error:', uploadErr);
          // Continue without resume if upload fails
        }
      }

      // Mark onboarding as completed
      console.log('💾 Atualizando candidate_profiles...', profileId);
      const { error: candidateError } = await supabase
        .from('candidate_profiles')
        .update({
          resume_url: resumeUrl || null,
          resume_filename: resumeFilename || null,
          onboarding_completed: true,
          profile_completion_percentage: 100,
        })
        .eq('id', profileId);

      if (candidateError) {
        console.error('❌ Erro ao atualizar candidate_profiles:', candidateError);
        throw candidateError;
      }

      console.log('✅ Perfil atualizado com sucesso! Redirecionando...');
      
      // Success! Redirect to candidate dashboard
      window.location.href = '/candidate';
    } catch (err: any) {
      console.error('❌ Finish error:', err);
      setError(err.message || 'Erro ao finalizar cadastro');
      setLoading(false);
    }
  };

  const addEducation = () => {
    setEducations([...educations, {
      id: Date.now().toString(),
      degreeLevel: '',
      courseName: '',
      institution: '',
      startYear: '',
      endYear: '',
      isCurrent: false,
    }]);
  };

  const removeEducation = (id: string) => {
    if (educations.length > 1) {
      setEducations(educations.filter(edu => edu.id !== id));
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      companyName: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    }]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const toggleEmploymentType = (type: EmploymentType) => {
    if (professionalData.employmentTypes.includes(type)) {
      setProfessionalData({
        ...professionalData,
        employmentTypes: professionalData.employmentTypes.filter(t => t !== type),
      });
    } else {
      setProfessionalData({
        ...professionalData,
        employmentTypes: [...professionalData.employmentTypes, type],
      });
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-fluid-h1 font-semibold text-[#141042] mb-2 sm:mb-3">Complete seu perfil</h1>
          <p className="text-fluid-base text-[#666666]">Preencha suas informações para começar a buscar vagas</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-[#141042] text-white'
                      : 'bg-[#E5E5DC] text-[#999999]'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                    ) : (
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center hidden sm:block ${
                    currentStep >= step.id ? 'text-[#141042] font-medium' : 'text-[#999999]'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-[#E5E5DC]'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-[#E5E5DC] rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-[#141042] h-1.5 sm:h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E5DC] p-4 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Data */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-fluid-h3 font-semibold text-[#141042] mb-4 sm:mb-6 flex items-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Dados Pessoais
              </h2>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personalData.fullName}
                  onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalData.cpf}
                    onChange={(e) => setPersonalData({ ...personalData, cpf: formatCPF(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Data de nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={personalData.birthDate}
                    onChange={(e) => setPersonalData({ ...personalData, birthDate: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={personalData.email}
                    onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: formatPhone(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalData.city}
                    onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                    placeholder="Digite sua cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={personalData.state}
                    onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  >
                    <option value="">UF</option>
                    {brazilianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Data */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-fluid-h3 font-semibold text-[#141042] mb-4 sm:mb-6 flex items-center">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Dados Profissionais
              </h2>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Cargo atual <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={professionalData.currentTitle}
                  onChange={(e) => setProfessionalData({ ...professionalData, currentTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  placeholder="Ex: Desenvolvedor Full Stack"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Área de atuação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={professionalData.areaOfExpertise}
                  onChange={(e) => setProfessionalData({ ...professionalData, areaOfExpertise: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  placeholder="Ex: Tecnologia da Informação"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Nível de senioridade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={professionalData.seniorityLevel}
                    onChange={(e) => setProfessionalData({ ...professionalData, seniorityLevel: e.target.value as SeniorityLevel })}
                    className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                  >
                    <option value="">Selecione</option>
                    {seniorityOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Pretensão salarial (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] font-medium text-sm sm:text-base">R$</span>
                    <input
                      type="text"
                      value={professionalData.salaryExpectation ? formatCurrency(professionalData.salaryExpectation.replace(/[^\d]/g, '') || '0') : ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        const numeric = parseCurrency(e.target.value);
                        setProfessionalData({ ...professionalData, salaryExpectation: numeric });
                      }}
                      className="w-full pl-12 pr-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all text-sm sm:text-base text-[#141042]"
                      placeholder="5.000,00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-3">
                  Disponibilidade <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {employmentTypeOptions.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEmploymentType(type)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all text-sm sm:text-base ${
                        professionalData.employmentTypes.includes(type)
                          ? 'border-[#141042] bg-[#141042] text-white'
                          : 'border-[#E5E5DC] hover:border-[#141042]/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-fluid-h3 font-semibold text-[#141042] flex items-center">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Formação Acadêmica
                </h2>
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[#141042] text-white rounded-xl hover:bg-[#1e1860] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {educations.map((education, index) => (
                  <div key={education.id} className="p-4 sm:p-6 bg-[#FAFAF8] rounded-xl border border-[#E5E5DC]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm sm:text-base font-medium text-[#141042]">Formação {index + 1}</h3>
                      {educations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(education.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#141042] mb-2">
                          Grau de escolaridade <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={education.degreeLevel}
                          onChange={(e) => updateEducation(education.id, 'degreeLevel', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                        >
                          <option value="">Selecione</option>
                          {degreeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#141042] mb-2">
                          Curso <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.courseName}
                          onChange={(e) => updateEducation(education.id, 'courseName', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                          placeholder="Ex: Ciência da Computação"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#141042] mb-2">
                          Instituição <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={education.institution}
                          onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                          placeholder="Ex: Universidade Federal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Ano de início
                          </label>
                          <input
                            type="number"
                            value={education.startYear}
                            onChange={(e) => updateEducation(education.id, 'startYear', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                            placeholder="2020"
                            min="1950"
                            max="2030"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Ano de conclusão
                          </label>
                          <input
                            type="number"
                            value={education.endYear}
                            onChange={(e) => updateEducation(education.id, 'endYear', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                            placeholder="2024"
                            min="1950"
                            max="2030"
                            disabled={education.isCurrent}
                          />
                        </div>
                      </div>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={education.isCurrent}
                          onChange={(e) => {
                            updateEducation(education.id, 'isCurrent', e.target.checked);
                            if (e.target.checked) {
                              updateEducation(education.id, 'endYear', '');
                            }
                          }}
                          className="w-5 h-5 text-[#141042] bg-white border-2 border-[#141042] rounded focus:ring-2 focus:ring-[#141042] cursor-pointer accent-[#141042]"
                        />
                        <span className="text-sm sm:text-base text-[#141042] font-medium">Cursando atualmente</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Experience */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-fluid-h3 font-semibold text-[#141042] flex items-center">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Experiência Profissional
                </h2>
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[#141042] text-white rounded-xl hover:bg-[#1e1860] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {experiences.map((experience, index) => (
                  <div key={experience.id} className="p-4 sm:p-6 bg-[#FAFAF8] rounded-xl border border-[#E5E5DC]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm sm:text-base font-medium text-[#141042]">Experiência {index + 1}</h3>
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(experience.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Empresa <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={experience.companyName}
                            onChange={(e) => updateExperience(experience.id, 'companyName', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                            placeholder="Ex: Tech Company"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Cargo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={experience.jobTitle}
                            onChange={(e) => updateExperience(experience.id, 'jobTitle', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                            placeholder="Ex: Desenvolvedor Full Stack"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Data de início <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="month"
                            value={experience.startDate}
                            onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#141042] mb-2">
                            Data de término
                          </label>
                          <input
                            type="month"
                            value={experience.endDate}
                            onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                            className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base text-[#141042]"
                            disabled={experience.isCurrent}
                          />
                        </div>
                      </div>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={experience.isCurrent}
                          onChange={(e) => {
                            updateExperience(experience.id, 'isCurrent', e.target.checked);
                            if (e.target.checked) {
                              updateExperience(experience.id, 'endDate', '');
                            }
                          }}
                          className="w-5 h-5 text-[#141042] bg-white border-2 border-[#141042] rounded focus:ring-2 focus:ring-[#141042] cursor-pointer accent-[#141042]"
                        />
                        <span className="text-sm sm:text-base text-[#141042] font-medium">Trabalho aqui atualmente</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-[#141042] mb-2">
                          Descrição das atividades
                        </label>
                        <textarea
                          value={experience.description}
                          onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] bg-white text-sm sm:text-base resize-none text-[#141042]"
                          rows={4}
                          placeholder="Descreva suas principais responsabilidades e conquistas..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Resume Upload */}
          {currentStep === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-fluid-h3 font-semibold text-[#141042] mb-4 sm:mb-6 flex items-center">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Upload de Currículo
              </h2>

              <div className="border-2 border-dashed border-[#E5E5DC] rounded-xl p-6 sm:p-12 text-center">
                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-[#999999] mx-auto mb-4" />
                
                {resumeFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-[#141042]">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium text-sm sm:text-base">{resumeFile.name}</span>
                    </div>
                    <p className="text-[#666666] text-xs sm:text-sm">
                      Tamanho: {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[#666666] mb-4 text-sm sm:text-base">
                      Arraste seu currículo ou clique para fazer upload
                    </p>
                    <p className="text-[#999999] text-xs sm:text-sm mb-4">
                      Formatos aceitos: PDF ou DOC (máx. 5MB)
                    </p>
                    <label className="inline-block px-6 py-3 bg-[#141042] text-white rounded-xl hover:bg-[#1e1860] transition-colors cursor-pointer text-sm sm:text-base">
                      Selecionar arquivo
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (file.size > maxSize) {
                              setError(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB`);
                              e.target.value = '';
                              return;
                            }
                            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                            if (!allowedTypes.includes(file.type)) {
                              setError('Formato não permitido. Use PDF ou DOC/DOCX');
                              e.target.value = '';
                              return;
                            }
                            setResumeFile(file);
                            setError('');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">📄 Opcional</p>
                <p>O upload do currículo é opcional. Você pode completá-lo mais tarde no seu perfil.</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 border-t border-[#E5E5DC]">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`w-full sm:w-auto order-2 sm:order-1 px-6 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                currentStep === 1
                  ? 'bg-[#E5E5DC] text-[#999999] cursor-not-allowed'
                  : 'bg-[#F5F5F0] text-[#141042] hover:bg-[#E5E5DC]'
              }`}
            >
              <ChevronLeft className="w-5 h-5 inline mr-2" />
              Voltar
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full sm:w-auto order-1 sm:order-2 px-6 py-3 bg-[#141042] text-white rounded-xl hover:bg-[#1e1860] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-5 h-5 inline ml-2" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  console.log('Finalizando cadastro...', { profileId, userId, resumeFile });
                  handleFinish();
                }}
                disabled={loading}
                className="w-full sm:w-auto order-1 sm:order-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Concluir Cadastro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
