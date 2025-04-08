import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
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
  useToast,
  Badge,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';
import { useAuth } from './AuthProvider';
import { getLootExchangeOffers, getRecentExchanges, getInventory } from '../services/nightvaleApi';

const RARITY_COLORS = {
  common: 'gray',
  uncommon: 'green',
  rare: 'blue',
  epic: 'purple',
  legendary: 'yellow',
};

function Loot() {
  const [offers, setOffers] = useState([]);
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rarityFilter, setRarityFilter] = useState('all');
  const { isAuthenticated, walletAddress } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      fetchLootData();
    }
  }, [isAuthenticated, walletAddress]);

  const fetchLootData = async () => {
    setLoading(true);
    try {
      const [offersData, exchangesData, inventoryData] = await Promise.all([
        getLootExchangeOffers(),
        getRecentExchanges(walletAddress),
        getInventory(walletAddress),
      ]);
      setOffers(offersData);
      setRecentExchanges(exchangesData);
      setInventory(inventoryData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch loot data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = rarityFilter === 'all'
    ? offers
    : offers.filter(offer => offer.itemMetadata.rarity.toLowerCase() === rarityFilter);

  const inventoryStats = inventory.reduce((acc, item) => {
    acc.totalItems += item.quantity;
    acc.totalValue += item.price * item.quantity;
    acc.rarityCounts[item.rarity] = (acc.rarityCounts[item.rarity] || 0) + item.quantity;
    return acc;
  }, { totalItems: 0, totalValue: 0, rarityCounts: {} });

  if (!isAuthenticated) {
    return (
      <Box p={4}>
        <Text>Please log in to view loot data.</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="md">Your Inventory</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Total Items</StatLabel>
                <StatNumber>{inventoryStats.totalItems}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Value</StatLabel>
                <StatNumber>{inventoryStats.totalValue.toLocaleString()} GOLD</StatNumber>
              </Stat>
            </StatGroup>
            <Table variant="simple" mt={4}>
              <Thead>
                <Tr>
                  <Th>Item</Th>
                  <Th>Rarity</Th>
                  <Th>Quantity</Th>
                  <Th>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {inventory.map((item, index) => (
                  <Tr key={index}>
                    <Td>{item.name}</Td>
                    <Td>
                      <Badge colorScheme={RARITY_COLORS[item.rarity.toLowerCase()]}>
                        {item.rarity}
                      </Badge>
                    </Td>
                    <Td>{item.quantity}</Td>
                    <Td>{(item.price * item.quantity).toLocaleString()} GOLD</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Loot Exchange Offers</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </Select>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th>Rarity</Th>
                    <Th>Price</Th>
                    <Th>Quantity</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredOffers.map((offer, index) => (
                    <Tr key={index}>
                      <Td>{offer.itemMetadata.name}</Td>
                      <Td>
                        <Badge colorScheme={RARITY_COLORS[offer.itemMetadata.rarity.toLowerCase()]}>
                          {offer.itemMetadata.rarity}
                        </Badge>
                      </Td>
                      <Td>{offer.price.toLocaleString()} GOLD</Td>
                      <Td>{offer.quantity}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Recent Exchanges</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Item</Th>
                  <Th>Rarity</Th>
                  <Th>Price</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentExchanges.map((exchange, index) => (
                  <Tr key={index}>
                    <Td>{new Date(exchange.timestamp).toLocaleDateString()}</Td>
                    <Td>{exchange.itemMetadata.name}</Td>
                    <Td>
                      <Badge colorScheme={RARITY_COLORS[exchange.itemMetadata.rarity.toLowerCase()]}>
                        {exchange.itemMetadata.rarity}
                      </Badge>
                    </Td>
                    <Td>{exchange.price.toLocaleString()} GOLD</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

export default Loot; 