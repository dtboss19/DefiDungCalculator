import React, { useEffect, useState } from 'react';
import { Box, Grid, Heading, Text, Card, CardHeader, CardBody, Stat, StatLabel, StatNumber, StatHelpText, Spinner } from '@chakra-ui/react';

const API_BASE_URL = 'http://localhost:5000';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalGold: 0,
    dailyAverage: 0,
    equipmentValue: 0,
    roi: 0,
    predictedMonthlyGold: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats({
          totalGold: 0,
          dailyAverage: 0,
          equipmentValue: 0,
          roi: 0,
          predictedMonthlyGold: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (value) => {
    return (value || 0).toFixed(2);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading dashboard data...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>DeFi Dungeons Dashboard</Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Gold Summary</Heading>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatLabel>Total Gold Earned</StatLabel>
              <StatNumber>{formatNumber(stats.totalGold)} GOLD</StatNumber>
              <StatHelpText>Daily Average: {formatNumber(stats.dailyAverage)}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Equipment Value</Heading>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatLabel>Total Equipment Value</StatLabel>
              <StatNumber>{formatNumber(stats.equipmentValue)} GOLD</StatNumber>
              <StatHelpText>Including all rarities</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">ROI Projection</Heading>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatLabel>Current ROI</StatLabel>
              <StatNumber>{formatNumber(stats.roi)}%</StatNumber>
              <StatHelpText>Monthly Predicted: {formatNumber(stats.predictedMonthlyGold)} GOLD</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default Dashboard; 