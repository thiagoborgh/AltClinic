import React from 'react';
import {
  Skeleton,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';

// Skeleton para lista de itens
export const SkeletonList = ({
  count = 5,
  height = 60,
  variant = 'rectangular'
}) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          height={height}
          sx={{ mb: 1, borderRadius: 1 }}
        />
      ))}
    </Box>
  );
};

// Skeleton para cards em grid
export const SkeletonCardGrid = ({
  count = 6,
  cardHeight = 200
}) => {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={cardHeight} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Skeleton para tabela
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <Table>
      {showHeader && (
        <TableBody>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton variant="text" width="80%" />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton variant="text" width="70%" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Skeleton para formulário
export const SkeletonForm = ({
  fields = 4,
  showButtons = true
}) => {
  return (
    <Box>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} mb={2}>
          <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={40} />
        </Box>
      ))}
      {showButtons && (
        <Box display="flex" gap={2} mt={3}>
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </Box>
      )}
    </Box>
  );
};

// Skeleton para página de agenda (específico)
export const SkeletonAgenda = () => {
  return (
    <Box>
      {/* Header da agenda */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Box display="flex" gap={2}>
          <Skeleton variant="rectangular" width={120} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
      </Box>

      {/* Calendário/Grade */}
      <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} />
    </Box>
  );
};

// Skeleton para lista de pacientes
export const SkeletonPatientList = ({ count = 8 }) => {
  return (
    <List>
      {Array.from({ length: count }).map((_, index) => (
        <ListItem key={index} divider>
          <ListItemText
            primary={<Skeleton variant="text" width="60%" />}
            secondary={<Skeleton variant="text" width="40%" />}
          />
          <Box display="flex" gap={1}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

// Componente genérico que escolhe o skeleton baseado no tipo
const SkeletonLoader = ({
  type = 'list',
  ...props
}) => {
  switch (type) {
    case 'list':
      return <SkeletonList {...props} />;
    case 'card-grid':
      return <SkeletonCardGrid {...props} />;
    case 'table':
      return <SkeletonTable {...props} />;
    case 'form':
      return <SkeletonForm {...props} />;
    case 'agenda':
      return <SkeletonAgenda {...props} />;
    case 'patient-list':
      return <SkeletonPatientList {...props} />;
    default:
      return <SkeletonList {...props} />;
  }
};

export default SkeletonLoader;