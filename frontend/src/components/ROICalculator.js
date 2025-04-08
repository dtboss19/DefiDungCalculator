import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Grid,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Divider,
  Spinner,
} from '@chakra-ui/react';

const API_BASE_URL = 'http://localhost:5000';
const INVESTMENT_AMOUNT_USDC = 575;

const ROICalculator = () => {
  const [stats, setStats] = useState({
    total_investment: INVESTMENT_AMOUNT_USDC,
    total_earnings: 0,
    daily_average: 0,
    projected_monthly: 0,
    days_to_roi: 0,
    roi_percentage: 0,
    current_value_usd: 0,
    prediction_confidence: 'LOW',
    daily_apy: 0,
    apy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchROIStats();
    // Refresh stats every 5 minutes to get updated prices
    const interval = setInterval(fetchROIStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchROIStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/roi/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch ROI stats');
      }
      const data = await response.json();
      setStats({
        ...stats,
        ...data,
        total_investment: INVESTMENT_AMOUNT_USDC // Always keep the constant investment amount
      });
    } catch (error) {
      console.error('Error fetching ROI stats:', error);
      setStats({
        total_investment: INVESTMENT_AMOUNT_USDC,
        total_earnings: 0,
        daily_average: 0,
        projected_monthly: 0,
        days_to_roi: 0,
        roi_percentage: 0,
        current_value_usd: 0,
        prediction_confidence: 'LOW',
        daily_apy: 0,
        apy: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'green';
    if (percentage >= 50) return 'yellow';
    return 'red';
  };

  const formatNumber = (value) => {
    return (value || 0).toFixed(2);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading ROI data...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>ROI Calculator</Heading>
      
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Investment Summary</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>Total Investment</StatLabel>
                <StatNumber>{formatNumber(stats.total_investment)} USDC</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats.roi_percentage >= 0 ? 'increase' : 'decrease'} />
                  {formatNumber(stats.roi_percentage)}% ROI
                </StatHelpText>
              </Stat>

              <Divider />

              <Box>
                <Text mb={2}>ROI Progress</Text>
                <Progress
                  value={stats.roi_percentage || 0}
                  colorScheme={getProgressColor(stats.roi_percentage || 0)}
                  size="lg"
                  borderRadius="md"
                />
              </Box>

              <Divider />

              <Stat>
                <StatLabel>Total Earnings</StatLabel>
                <StatNumber>{formatNumber(stats.total_earnings)} GOLD</StatNumber>
                <StatHelpText>
                  ≈ ${formatNumber(stats.current_value_usd)} USD
                </StatHelpText>
                <StatHelpText>
                  Daily Average: {formatNumber(stats.daily_average)} GOLD
                </StatHelpText>
              </Stat>

              <Divider />

              <Stat>
                <StatLabel>Daily APY</StatLabel>
                <StatNumber>{formatNumber(stats.daily_apy)}%</StatNumber>
                <StatHelpText>
                  Annual APY: {formatNumber(stats.apy)}%
                </StatHelpText>
              </Stat>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Projections</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>Projected Monthly Earnings</StatLabel>
                <StatNumber>{formatNumber(stats.projected_monthly)} GOLD</StatNumber>
                <StatHelpText>
                  Based on current daily average
                </StatHelpText>
              </Stat>

              <Divider />

              <Stat>
                <StatLabel>Days Until ROI</StatLabel>
                <StatNumber>{Math.ceil(stats.days_to_roi || 0)} Days</StatNumber>
                <StatHelpText>
                  Prediction Confidence: {stats.prediction_confidence || 'LOW'}
                </StatHelpText>
              </Stat>

              <Divider />

              <Box>
                <Text mb={2}>Monthly Target Progress</Text>
                <Progress
                  value={((stats.total_earnings || 0) / (stats.projected_monthly || 1)) * 100}
                  colorScheme="blue"
                  size="lg"
                  borderRadius="md"
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default ROICalculator; 