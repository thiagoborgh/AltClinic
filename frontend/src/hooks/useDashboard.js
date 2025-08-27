import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { mockDashboardData } from '../data/mockData';

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
  const [chartData, setChartData] = useState(null);

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
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      }

      // Processar atividades
      if (activitiesRes.status === 'fulfilled') {
        setActivities(activitiesRes.value.data);
      }

      // Processar agendamentos
      if (appointmentsRes.status === 'fulfilled') {
        setAppointments(appointmentsRes.value.data);
      }

      // Processar dados dos gráficos
      if (chartRes.status === 'fulfilled') {
        setChartData(chartRes.value.data);
      }

    } catch (error) {
      console.warn('API não disponível, usando dados mockados para demonstração');
      
      // Usar dados mockados quando API não estiver disponível
      setMetrics(mockDashboardData.metrics);
      setActivities(mockDashboardData.activities);
      setAppointments(mockDashboardData.appointments);
      setChartData(mockDashboardData.chartData);
      
      // Não mostrar toast de erro para demo
      // toast.error('Erro ao carregar dados do dashboard');
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
