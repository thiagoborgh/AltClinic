import { useState, useEffect, useMemo } from 'react';
import { professionalService } from '../services/api';

export const useProfessionalSchedules = (selectedProfessional = null) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar horários dos profissionais
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Carregando horários para profissional:', selectedProfessional);
        const response = await professionalService.getSchedules(selectedProfessional);
        console.log('📋 Resposta da API de horários:', response);
        
        if (response.data && response.data.success) {
          const responseData = response.data.data || {};
          console.log('✅ Dados de horários recebidos:', responseData);
          
          // Se os dados vêm em formato { schedulesByDay: {...}, totalSchedules: n }
          if (responseData.schedulesByDay) {
            // Converter schedulesByDay para array plano
            const scheduleArray = [];
            Object.entries(responseData.schedulesByDay).forEach(([dayName, daySchedules]) => {
              if (Array.isArray(daySchedules)) {
                console.log(`📅 Processando ${dayName}: ${daySchedules.length} horários`);
                scheduleArray.push(...daySchedules);
              }
            });
            console.log('🔄 Convertido schedulesByDay para array:', scheduleArray);
            setSchedules(scheduleArray);
          } 
          // Se os dados já vêm como array
          else if (Array.isArray(responseData)) {
            console.log('📋 Dados já em formato array:', responseData);
            setSchedules(responseData);
          }
          // Fallback
          else {
            console.log('⚠️ Formato de dados desconhecido, usando mock');
            setSchedules(getMockSchedules());
          }
        } else {
          console.log('⚠️ API não retornou sucesso, usando dados mock');
          // Fallback para dados mock se API não responder
          setSchedules(getMockSchedules());
        }
      } catch (err) {
        console.warn('❌ Erro ao carregar horários, usando dados mock:', err);
        setSchedules(getMockSchedules());
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [selectedProfessional]);

  // Dados mock para desenvolvimento
  const getMockSchedules = () => [
    {
      id: 1,
      professional_id: 1,
      professional_name: 'Dr. João Silva',
      day_of_week: 1, // Segunda
      start_time: '08:00',
      end_time: '18:00',
      is_active: 1
    },
    {
      id: 2,
      professional_id: 1,
      professional_name: 'Dr. João Silva',
      day_of_week: 2, // Terça
      start_time: '08:00',
      end_time: '18:00',
      is_active: 1
    },
    {
      id: 3,
      professional_id: 2,
      professional_name: 'Dra. Maria Santos',
      day_of_week: 1, // Segunda
      start_time: '09:00',
      end_time: '17:00',
      is_active: 1
    },
    {
      id: 4,
      professional_id: 2,
      professional_name: 'Dra. Maria Santos',
      day_of_week: 2, // Terça
      start_time: '09:00',
      end_time: '17:00',
      is_active: 1
    },
    {
      id: 5,
      professional_id: 3,
      professional_name: 'Dr. Carlos Lima',
      day_of_week: 1, // Segunda
      start_time: '07:00',
      end_time: '19:00',
      is_active: 1
    }
  ];

  // Converter hora em string para minutos
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Converter minutos para hora em string
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Calcular horários válidos para o calendário
  const getValidTimeSlots = useMemo(() => {
    // Garantir que schedules seja um array
    const schedulesArray = Array.isArray(schedules) ? schedules : [];
    
    if (!schedulesArray.length) return { min: '08:00', max: '18:00' };

    // Se há um profissional específico selecionado
    if (selectedProfessional) {
      const professionalSchedules = schedulesArray.filter(
        s => s.professional_id === parseInt(selectedProfessional)
      );
      
      if (professionalSchedules.length > 0) {
        const startTimes = professionalSchedules.map(s => s.start_time);
        const endTimes = professionalSchedules.map(s => s.end_time);
        
        return {
          min: Math.min(...startTimes.map(timeToMinutes)),
          max: Math.max(...endTimes.map(timeToMinutes))
        };
      }
    }

    // Se não há profissional selecionado, pegar o range geral
    const allStartTimes = schedulesArray.map(s => s.start_time);
    const allEndTimes = schedulesArray.map(s => s.end_time);
    
    if (allStartTimes.length > 0 && allEndTimes.length > 0) {
      return {
        min: Math.min(...allStartTimes.map(timeToMinutes)),
        max: Math.max(...allEndTimes.map(timeToMinutes))
      };
    }

    // Fallback padrão
    return { min: timeToMinutes('08:00'), max: timeToMinutes('18:00') };
  }, [schedules, selectedProfessional]);

  // Obter horários formatados para o react-big-calendar
  const getCalendarTimeSlots = () => {
    const { min, max } = getValidTimeSlots;
    
    return {
      min: new Date(1970, 0, 1, Math.floor(min / 60), min % 60),
      max: new Date(1970, 0, 1, Math.floor(max / 60), max % 60),
      step: 30, // Intervalos de 30 minutos
      timeslots: 2 // 2 slots por hora (30 min cada)
    };
  };

  // Verificar se um horário está dentro do range válido
  const isTimeSlotValid = (date, professionalId = null) => {
    const targetProfessional = professionalId || selectedProfessional;
    
    if (!targetProfessional) return true; // Se não há profissional, aceitar qualquer horário
    
    const dayOfWeek = date.getDay();
    const timeMinutes = date.getHours() * 60 + date.getMinutes();
    
    // Garantir que schedules seja um array
    const schedulesArray = Array.isArray(schedules) ? schedules : [];
    
    const professionalSchedules = schedulesArray.filter(
      s => s.professional_id === parseInt(targetProfessional) && s.day_of_week === dayOfWeek
    );
    
    if (professionalSchedules.length === 0) return false; // Profissional não trabalha neste dia
    
    return professionalSchedules.some(schedule => {
      const startMinutes = timeToMinutes(schedule.start_time);
      const endMinutes = timeToMinutes(schedule.end_time);
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    });
  };

  // Obter horários disponíveis para um dia específico
  const getAvailableTimesForDay = (date, professionalId = null) => {
    const targetProfessional = professionalId || selectedProfessional;
    const dayOfWeek = date.getDay();
    
    console.log('🔍 getAvailableTimesForDay:', {
      date: date.toDateString(),
      dayOfWeek,
      targetProfessional,
      schedulesLength: schedules.length
    });
    
    // Garantir que schedules seja um array
    const schedulesArray = Array.isArray(schedules) ? schedules : [];
    
    // Filtrar horários do profissional para o dia da semana
    let professionalSchedules = schedulesArray.filter(
      s => s.professional_id === parseInt(targetProfessional) && s.day_of_week === dayOfWeek
    );
    
    // Se não encontrou horários com professional_id específico, tentar buscar horários genéricos
    if (professionalSchedules.length === 0 && targetProfessional) {
      console.log('🔄 Não encontrou horários com professional_id, tentando horários genéricos...');
      professionalSchedules = schedulesArray.filter(
        s => (s.professional_id === null || s.professional_id === undefined) && s.day_of_week === dayOfWeek
      );
    }
    
    console.log('📋 Horários encontrados para o profissional:', professionalSchedules);
    
    const availableTimes = [];
    
    professionalSchedules.forEach(schedule => {
      const startMinutes = timeToMinutes(schedule.start_time);
      const endMinutes = timeToMinutes(schedule.end_time);
      
      console.log(`⏰ Processando horário: ${schedule.start_time} - ${schedule.end_time} (${startMinutes} - ${endMinutes} minutos)`);
      
      // Gerar slots de 30 minutos
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        availableTimes.push({
          time: minutesToTime(minutes),
          timeMinutes: minutes,
          professionalId: schedule.professional_id,
          professionalName: schedule.professional_name
        });
      }
    });
    
    console.log(`✅ Total de slots gerados: ${availableTimes.length}`, availableTimes.slice(0, 5));
    
    return availableTimes;
  };

  return {
    schedules,
    loading,
    error,
    getValidTimeSlots,
    getCalendarTimeSlots,
    isTimeSlotValid,
    getAvailableTimesForDay,
    timeToMinutes,
    minutesToTime
  };
};

export default useProfessionalSchedules;