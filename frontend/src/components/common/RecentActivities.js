import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box
} from '@mui/material';
import {
  CalendarToday,
  WhatsApp,
  MonetizationOn,
  PersonAdd,
  Message
} from '@mui/icons-material';

const ActivityIcon = ({ type }) => {
  const iconMap = {
    agendamento: CalendarToday,
    whatsapp: WhatsApp,
    proposta: MonetizationOn,
    paciente: PersonAdd,
    mensagem: Message
  };
  
  const colorMap = {
    agendamento: 'primary',
    whatsapp: 'success',
    proposta: 'warning',
    paciente: 'info',
    mensagem: 'secondary'
  };
  
  const IconComponent = iconMap[type] || Message;
  const color = colorMap[type] || 'primary';
  
  return (
    <Avatar sx={{ bgcolor: `${color}.main` }}>
      <IconComponent />
    </Avatar>
  );
};

const RecentActivities = ({ activities = [] }) => {
  // Sistema profissional: mostrar apenas dados reais, sem mock
  const displayActivities = Array.isArray(activities) ? activities : [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Atividades Recentes
        </Typography>
        
        <List disablePadding>
          {displayActivities.map((activity, index) => (
            <ListItem
              key={activity.id}
              divider={index < displayActivities.length - 1}
              sx={{ px: 0 }}
            >
              <ListItemAvatar>
                <ActivityIcon type={activity.type} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight="medium">
                    {activity.title}
                  </Typography>
                }
                secondary={
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
