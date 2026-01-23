import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

/**
 * ✅ Hook Dashboard - SEM DADOS MOCK
 * Retorna apenas dados reais do Firestore
 */
export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayAppointments: { value: 0, variation: 0 },
    activePatients: { value: 0, variation: 0 },
    monthlyRevenue: { value: 'R$ 0', variation: 0 },
    occupationRate: { value: '0%', variation: 0 }
  });
  const [activities, setActivities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [chartData, setChartData] = useState({
    appointmentsRevenue: null,
    procedures: null
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados em paralelo
      const [metricsRes, activitiesRes, appointmentsRes, chartRes] = await Promise.allSettled([
        dashboardService.getMetrics(),
        dashboardService.getActivities(),
        dashboardService.getAppointments(),
        dashboardService.getChartData()
      ]);

      // Processar métricas
      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        const apiMetrics = metricsRes.value.data;
        setMetrics({
          todayAppointments: apiMetrics.todayAppointments || { value: 0, variation: 0 },
          activePatients: apiMetrics.activePatients || { value: 0, variation: 0 },
          monthlyRevenue: apiMetrics.monthlyRevenue || { value: 'R$ 0', variation: 0 },
          occupationRate: apiMetrics.occupationRate || { value: '0%', variation: 0 }
        });
      }

      // Processar atividades
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value?.data) {
        setActivities(activitiesRes.value.data);
      }

      // Processar agendamentos
      if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value?.data) {
        setAppointments(appointmentsRes.value.data);
      }

      // Processar dados dos gráficos
      if (chartRes.status === 'fulfilled' && chartRes.value?.data) {
        setChartData(chartRes.value.data);
      }

    } catch (error) {
      console.log('ℹ️ Erro ao carregar dashboard:', error.message);
      // Sistema profissional: não mostra dados fake em caso de erro
      // Mantém os valores iniciais (zerados)
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    loading,
    metrics,
    activities,
    appointments,
    chartData,
    refreshData
  };
};

export default useDashboard;
