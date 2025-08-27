import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Card, CardContent, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProceduresChart = ({ data }) => {
  const defaultData = {
    labels: ['Limpeza de Pele', 'Botox', 'Preenchimento', 'Peeling', 'Outros'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartData = data || defaultData;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Procedimentos Mais Procurados
        </Typography>
        <div style={{ height: '300px' }}>
          <Pie data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProceduresChart;
