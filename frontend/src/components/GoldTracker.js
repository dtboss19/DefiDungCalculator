import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tfoot,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  StatArrow,
} from '@chakra-ui/react';

const API_BASE_URL = 'http://localhost:5000';

function GoldTracker() {
  const [stats, setStats] = useState(null);
  const [dailyEarnings, setDailyEarnings] = useState({});
  const [roiStats, setRoiStats] = useState({
    total_investment: 575,
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
  const [error, setError] = useState(null);
  const [goldPrice, setGoldPrice] = useState(null);
  const [nftPrice, setNftPrice] = useState(null);
  const toast = useToast();

  const calculateDailyEarnings = (exchanges, achievementStats) => {
    const earnings = {};
    
    // Process exchanges
    exchanges.forEach(exchange => {
      const date = new Date(exchange.createdAt).toLocaleDateString();
      if (!earnings[date]) {
        earnings[date] = {
          earned: 0,
          offerCount: 0
        };
      }
      
      const earned = parseFloat(exchange.totalEarned) || 0;
      earnings[date].earned += earned;
      earnings[date].offerCount += exchange.offerCount || 0;
    });

    // Sort dates in descending order
    const sortedEarnings = Object.entries(earnings)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .reduce((acc, [date, data]) => {
        acc[date] = data;
        return acc;
      }, {});

    return sortedEarnings;
  };

  const calculateTotals = (earnings) => {
    return Object.values(earnings).reduce((totals, day) => {
      return {
        totalItemsSold: totals.totalItemsSold + day.offerCount,
        totalGoldEarned: totals.totalGoldEarned + day.earned
      };
    }, { totalItemsSold: 0, totalGoldEarned: 0 });
  };

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gold/price`);
      console.log("Gold Price API Response Status:", response.status);
      if (!response.ok) throw new Error(`Failed to fetch gold price - Status: ${response.status}`);
      const data = await response.json();
      console.log("Fetched Gold Price Data:", data);
      const price = (typeof data.price === 'number') ? data.price : null;
      setGoldPrice(price);
      return price;
    } catch (error) {
      console.error('Error fetching gold price:', error);
      setGoldPrice(null);
      return null;
    }
  };

  const fetchNftPrice = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/nft/price`);
      console.log("NFT Price API Response Status:", response.status);
      if (!response.ok) throw new Error(`Failed to fetch NFT price - Status: ${response.status}`);
      const data = await response.json();
      console.log("Fetched NFT Price Data:", data);
      const price = (typeof data.price === 'number') ? data.price : null;
      setNftPrice(price);
      return price;
    } catch (error) {
      console.error('Error fetching NFT price:', error);
      setNftPrice(null);
      return null;
    }
  };

  const calculateRoiStats = (earnings, currentGoldPrice) => {
    const priceMultiplier = (typeof currentGoldPrice === 'number' && currentGoldPrice > 0) ? currentGoldPrice : 0;
    console.log("Calculating ROI with Earnings:", earnings, "and Gold Price Multiplier:", priceMultiplier);
    const totalEarningsGold = Object.values(earnings).reduce((sum, day) => sum + day.earned, 0);
    const totalEarningsUSD = totalEarningsGold * priceMultiplier;
    const numberOfDays = Object.keys(earnings).length;
    const dailyAverageUSD = numberOfDays > 0 ? (totalEarningsUSD / numberOfDays) : 0;
    const projectedMonthlyUSD = dailyAverageUSD * 30;
    const investment = (typeof roiStats.total_investment === 'number' && roiStats.total_investment > 0) ? roiStats.total_investment : 1;
    const roiPercentage = ((totalEarningsUSD - investment) / investment) * 100;
    const dailyAvgDivisor = (typeof dailyAverageUSD === 'number' && dailyAverageUSD > 0) ? dailyAverageUSD : Infinity;
    const daysToRoi = investment > 0 ? (investment / dailyAvgDivisor) : Infinity;

    console.log("Calculated ROI Stats:", {
      totalEarningsGold,
      totalEarningsUSD,
      dailyAverageUSD,
      projectedMonthlyUSD,
      roiPercentage,
      daysToRoi
    });

    setRoiStats((prevStats) => ({
      ...prevStats,
      total_earnings: totalEarningsUSD,
      daily_average: dailyAverageUSD,
      projected_monthly: projectedMonthlyUSD,
      roi_percentage: roiPercentage,
      days_to_roi: daysToRoi,
      current_value_usd: totalEarningsUSD
    }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exchangesRes, statsRes] = await Promise.all([
        fetch('/data/recent_exchanges.json'),
        fetch('/data/achievement_stats.json')
      ]);

      const [exchangesData, statsData] = await Promise.all([
        exchangesRes.json(),
        statsRes.json()
      ]);

      setStats(statsData.data);
      const dailyEarningsData = calculateDailyEarnings(
        exchangesData.data,
        statsData.data
      );
      setDailyEarnings(dailyEarningsData);

      const [currentGoldPrice, currentNftPrice] = await Promise.all([
        fetchGoldPrice(),
        fetchNftPrice()
      ]);

      calculateRoiStats(dailyEarningsData, currentGoldPrice);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
      toast({
        title: 'Error fetching data',
        description: error.message || 'Failed to fetch data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading your stats...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          <Alert status="error">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error Loading Stats</AlertTitle>
              <AlertDescription display="block">
                {error}
              </AlertDescription>
            </Box>
          </Alert>
          <Button onClick={fetchData} isLoading={loading}>
            Retry
          </Button>
        </VStack>
      </Box>
    );
  }

  const totals = calculateTotals(dailyEarnings);

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="md">Market Snapshot</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>NFT Floor Price</StatLabel>
                <StatNumber>${nftPrice ? nftPrice.toFixed(2) : 'N/A'}</StatNumber>
                <StatHelpText>Current Market (USD)</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>GOLD Price</StatLabel>
                <StatNumber>${goldPrice ? goldPrice.toFixed(4) : 'N/A'}</StatNumber>
                <StatHelpText>USD per GOLD</StatHelpText>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Achievement Summary</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Total Gold Earned</StatLabel>
                <StatNumber>{stats?.totalGoldEarned?.toLocaleString() || 0}</StatNumber>
                <StatHelpText>All Time</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Total Quests</StatLabel>
                <StatNumber>{stats?.totalQuestCompleted || 0}</StatNumber>
                <StatHelpText>Completed</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Total Dungeons</StatLabel>
                <StatNumber>{stats?.totalDungeonsCompleted || 0}</StatNumber>
                <StatHelpText>Completed</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Raid Bosses</StatLabel>
                <StatNumber>{stats?.totalRaidBossesKilled || 0}</StatNumber>
                <StatHelpText>Defeated</StatHelpText>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Daily Gold Earnings</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th isNumeric>Items Sold</Th>
                  <Th isNumeric>Gold Earned</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(dailyEarnings).map(([date, data]) => (
                  <Tr key={date}>
                    <Td>{date}</Td>
                    <Td isNumeric>{data.offerCount}</Td>
                    <Td isNumeric>{data.earned.toFixed(2)}</Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
                <Tr>
                  <Th>Total</Th>
                  <Th isNumeric>{totals.totalItemsSold}</Th>
                  <Th isNumeric>{totals.totalGoldEarned.toFixed(2)} GOLD</Th>
                </Tr>
              </Tfoot>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">ROI Summary (USD)</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Total Investment</StatLabel>
                <StatNumber>${roiStats.total_investment.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type={roiStats.roi_percentage >= 0 ? 'increase' : 'decrease'} />
                  {roiStats.roi_percentage.toFixed(2)}% ROI
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Total Earnings</StatLabel>
                <StatNumber>${roiStats.total_earnings.toFixed(2)}</StatNumber>
                <StatHelpText>
                  Daily Avg: ${roiStats.daily_average.toFixed(2)}
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Proj. Monthly Earnings</StatLabel>
                <StatNumber>${roiStats.projected_monthly.toFixed(2)}</StatNumber>
                <StatHelpText>
                  Based on daily average
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Est. Days Until ROI</StatLabel>
                <StatNumber>{isFinite(roiStats.days_to_roi) ? Math.ceil(roiStats.days_to_roi) : 'N/A'}</StatNumber>
                <StatHelpText>
                  Confidence: {roiStats.prediction_confidence}
                </StatHelpText>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

export default GoldTracker; 