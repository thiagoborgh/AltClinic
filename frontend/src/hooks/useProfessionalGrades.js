import { useState, useEffect, useCallback } from 'react';

// Dados mock para desenvolvimento
const mockGrades = [
  {
    id: 1,
    professionalId: '1',
    dayOfWeek: 'SEGUNDA',
    horaInicio: '09:00',
    horaFim: '17:00',
    intervaloMinutos: 30,
    local: 1,
    maxRetornos: 5,
    maxEncaixes: 2,
    vigenteDesde: '2025-01-01',
    vigenteAte: '2025-12-31',
    horariosPersonalizados: false,
    horariosCustomizados: '',
    active: true
  },
  {
    id: 2,
    professionalId: '1',
    dayOfWeek: 'QUINTA',
    horaInicio: '08:00',
    horaFim: '16:00',
    intervaloMinutos: 45,
    local: 2,
    maxRetornos: null,
    maxEncaixes: 3,
    vigenteDesde: '2025-01-01',
    vigenteAte: '2025-12-31',
    horariosPersonalizados: true,
    horariosCustomizados: '08:00,08:45,09:30,10:15,11:00,14:00,14:45,15:30',
    active: true
  }
];

export const useProfessionalGrades = (professionalId) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar grades do profissional
  const loadGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filteredGrades = mockGrades.filter(
        grade => grade.professionalId === professionalId
      );
      
      setGrades(filteredGrades);
    } catch (err) {
      setError('Erro ao carregar configurações da grade');
      console.error('Erro ao carregar grades:', err);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  // Salvar grade
  const saveGrade = async (gradeData) => {
    setLoading(true);
    setError(null);

    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newGrade = {
        id: Date.now(),
        professionalId,
        dayOfWeek: mapDayToEnum(gradeData.selectedDay),
        horaInicio: gradeData.horaInicio.format('HH:mm'),
        horaFim: gradeData.horaFim.format('HH:mm'),
        intervaloMinutos: gradeData.intervaloMinutos,
        local: gradeData.local,
        maxRetornos: gradeData.maxRetornos || null,
        maxEncaixes: gradeData.maxEncaixes || null,
        vigenteDesde: gradeData.vigenteDesde.format('YYYY-MM-DD'),
        vigenteAte: gradeData.sempreAte ? null : gradeData.vigenteAte.format('YYYY-MM-DD'),
        horariosPersonalizados: gradeData.horariosPersonalizados,
        horariosCustomizados: gradeData.horariosCustomizados,
        active: true
      };

      // Se duplicação estiver habilitada, criar grades para dias selecionados
      const gradesToSave = [newGrade];
      
      if (gradeData.duplicarDias) {
        Object.keys(gradeData.diasSelecionados).forEach(dia => {
          if (gradeData.diasSelecionados[dia] && dia !== gradeData.selectedDay) {
            gradesToSave.push({
              ...newGrade,
              id: Date.now() + Math.random(),
              dayOfWeek: mapDayToEnum(dia)
            });
          }
        });
      }

      // Atualizar estado local
      setGrades(prev => [...prev, ...gradesToSave]);
      
      return gradesToSave;
    } catch (err) {
      setError('Erro ao salvar configuração da grade');
      console.error('Erro ao salvar grade:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir grade
  const deleteGrade = async (gradeId) => {
    setLoading(true);
    setError(null);

    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGrades(prev => prev.filter(grade => grade.id !== gradeId));
    } catch (err) {
      setError('Erro ao excluir configuração da grade');
      console.error('Erro ao excluir grade:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter grade por dia da semana
  const getGradeByDay = (dayOfWeek) => {
    const dayEnum = mapDayToEnum(dayOfWeek);
    return grades.find(grade => grade.dayOfWeek === dayEnum && grade.active);
  };

  // Gerar slots disponíveis baseado na configuração
  const generateAvailableSlots = (dayOfWeek, date) => {
    const grade = getGradeByDay(dayOfWeek);
    if (!grade) return [];

    const slots = [];
    
    if (grade.horariosPersonalizados && grade.horariosCustomizados) {
      // Usar horários personalizados
      const horariosCustom = grade.horariosCustomizados.split(',');
      horariosCustom.forEach(horario => {
        slots.push({
          time: horario.trim(),
          available: true,
          gradeId: grade.id
        });
      });
    } else {
      // Usar intervalo regular
      const [horaInicio, minutoInicio] = grade.horaInicio.split(':').map(Number);
      const [horaFim, minutoFim] = grade.horaFim.split(':').map(Number);
      
      let currentHour = horaInicio;
      let currentMinute = minutoInicio;
      
      while (
        currentHour < horaFim || 
        (currentHour === horaFim && currentMinute <= minutoFim)
      ) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        slots.push({
          time: timeString,
          available: true,
          gradeId: grade.id
        });
        
        // Adicionar intervalo
        currentMinute += grade.intervaloMinutos;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
    }

    return slots;
  };

  // Mapear dia da semana para enum
  const mapDayToEnum = (day) => {
    const mapping = {
      'domingo': 'DOMINGO',
      'segunda': 'SEGUNDA',
      'segunda-feira': 'SEGUNDA',
      'terca': 'TERCA',
      'terça-feira': 'TERCA',
      'quarta': 'QUARTA',
      'quarta-feira': 'QUARTA',
      'quinta': 'QUINTA',
      'quinta-feira': 'QUINTA',
      'sexta': 'SEXTA',
      'sexta-feira': 'SEXTA',
      'sabado': 'SABADO',
      'sábado': 'SABADO'
    };
    
    return mapping[day.toLowerCase()] || day.toUpperCase();
  };

  // Validar configuração de grade
  const validateGradeConfig = (gradeData) => {
    const errors = [];

    // Validações básicas
    if (!gradeData.horaInicio || !gradeData.horaFim) {
      errors.push('Horários de início e fim são obrigatórios');
    }

    if (gradeData.horaInicio && gradeData.horaFim) {
      if (gradeData.horaInicio.isAfter(gradeData.horaFim)) {
        errors.push('Hora de início deve ser anterior à hora de fim');
      }
    }

    if (!gradeData.intervaloMinutos || gradeData.intervaloMinutos <= 0) {
      errors.push('Intervalo deve ser maior que 0 minutos');
    }

    if (!gradeData.local) {
      errors.push('Local é obrigatório');
    }

    // Validar horários personalizados
    if (gradeData.horariosPersonalizados && gradeData.horariosCustomizados) {
      const horarios = gradeData.horariosCustomizados.split(',');
      const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      for (let horario of horarios) {
        if (!regex.test(horario.trim())) {
          errors.push('Formato de horário personalizado inválido. Use HH:MM');
          break;
        }
      }
    }

    return errors;
  };

  // Função para salvar grade com duplicação
  const saveGradeWithDuplication = useCallback(async (gradeData, daysToApply) => {
    setLoading(true);
    setError(null);
    
    try {
      const gradesToSave = daysToApply.map(day => ({
        ...gradeData,
        dayOfWeek: day,
        id: Date.now() + Math.random() // ID temporário
      }));

      // Simular salvamento na API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualizar grades localmente
      setGrades(currentGrades => {
        const updatedGrades = [...currentGrades];
        
        gradesToSave.forEach(newGrade => {
          const existingIndex = updatedGrades.findIndex(
            g => g.professionalId === newGrade.professionalId && 
                 g.dayOfWeek === newGrade.dayOfWeek
          );
          
          if (existingIndex >= 0) {
            updatedGrades[existingIndex] = newGrade;
          } else {
            updatedGrades.push(newGrade);
          }
        });
        
        return updatedGrades;
      });

      return { success: true, message: 'Grades salvas com sucesso!' };
    } catch (err) {
      const errorMessage = 'Erro ao salvar grades: ' + err.message;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar grades ao montar o hook
  useEffect(() => {
    const fetchGrades = async () => {
      if (professionalId) {
        await loadGrades();
      }
    };
    
    fetchGrades();
  }, [professionalId, loadGrades]);

  return {
    grades,
    loading,
    error,
    loadGrades,
    saveGrade,
    saveGradeWithDuplication,
    deleteGrade,
    getGradeByDay,
    generateAvailableSlots,
    validateGradeConfig
  };
};