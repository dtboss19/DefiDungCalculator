import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Grid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Card,
  CardHeader,
  CardBody,
  Badge,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const API_BASE_URL = 'http://localhost:5000';

const MarketAnalyzer = () => {
  const [marketData, setMarketData] = useState({
    recommendations: [],
    message: null
  });
  const [inventory, setInventory] = useState([]);
  const [goldPrice, setGoldPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const rarityColors = {
    GREY: 'gray',
    GREEN: 'green',
    BLUE: 'blue',
    PURPLE: 'purple',
    GOLD: 'yellow',
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchMarketData(),
        fetchInventory(),
        fetchGoldPrice()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/market/analysis`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (!error.message.includes('404')) {
        toast({
          title: 'Error fetching market data',
          description: 'Please try again later',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gold/price`);
      if (!response.ok) throw new Error('Failed to fetch gold price');
      const data = await response.json();
      setGoldPrice(data.price);
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      if (!error.message.includes('404')) {
        toast({
          title: 'Error fetching inventory',
          description: 'Please try again later',
          status: 'error',
          duration: 5000,
        });
      }
      setInventory([]);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'SELL': return 'red';
      case 'BUY': return 'green';
      case 'HOLD': return 'yellow';
      default: return 'gray';
    }
  };

  const formatGoldPrice = (price) => {
    if (!price || price === 0) return 'Loading...';
    return price.toFixed(4);
  };

  const formatUsdValue = (goldAmount) => {
    if (!goldPrice || !goldAmount) return '0.00';
    return (goldAmount * goldPrice).toFixed(2);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading market data...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Market Analyzer</Heading>
      
      <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Market Overview</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>GOLD Price (USD)</StatLabel>
                <StatNumber>${formatGoldPrice(goldPrice)}</StatNumber>
              </Stat>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Inventory Value</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>Total Value (GOLD)</StatLabel>
                <StatNumber>
                  {inventory.reduce((sum, item) => sum + (item.current_price * item.quantity), 0).toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  ${formatUsdValue(inventory.reduce((sum, item) => sum + (item.current_price * item.quantity), 0))} USD
                </StatHelpText>
              </Stat>
            </VStack>
          </CardBody>
        </Card>
      </Grid>

      {marketData.message && (
        <Alert status="info" mb={6}>
          <AlertIcon />
          {marketData.message}
        </Alert>
      )}

      {marketData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Market Recommendations</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Item</Th>
                  <Th>Action</Th>
                  <Th>Reason</Th>
                </Tr>
              </Thead>
              <Tbody>
                {marketData.recommendations.map((rec, idx) => (
                  <Tr key={idx}>
                    <Td>{rec.item_name}</Td>
                    <Td>
                      <Badge colorScheme={getActionColor(rec.action)}>
                        {rec.action}
                      </Badge>
                    </Td>
                    <Td>{rec.reason}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default MarketAnalyzer; 