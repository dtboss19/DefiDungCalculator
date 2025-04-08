import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
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
  Text,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  Image,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Grid,
  StatGroup,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

function DungeonCalculator() {
  const [dungeons, setDungeons] = useState([]);
  const [dropChances, setDropChances] = useState([]);
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [baseStats, setBaseStats] = useState({
    power: 0,
    vitality: 0,
    fortune: 0,
    luck: 0
  });
  const [equippedItems, setEquippedItems] = useState({
    Weapon: null,
    Headpiece: null,
    Chest: null,
    Legs: null,
    Boots: null
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dungeonsRes, dropChancesRes, inventoryRes] = await Promise.all([
          fetch('/data/dungeon_definitions.json'),
          fetch('/data/drop_chances.json'),
          fetch('/data/inventory_items.json')
        ]);

        const [dungeonsData, dropChancesData, inventoryData] = await Promise.all([
          dungeonsRes.json(),
          dropChancesRes.json(),
          inventoryRes.json()
        ]);

        // Iterate over dungeons to ensure base chance is applied
        const updatedDungeons = dungeonsData.data.map(dungeon => {
          return {
            ...dungeon,
            baseBossKillChance: parseFloat(dungeon.dungeonBossKillChance)
          };
        });

        setDungeons(updatedDungeons);
        setDropChances(dropChancesData.data);
        setInventory(inventoryData.data);

        // Auto-equip best items based on power + vitality
        const bestItems = findBestItems(inventoryData.data);
        setEquippedItems(bestItems);
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  const findBestItems = (items) => {
    const bestBySlot = {};
    const slots = ['Weapon', 'Headpiece', 'Chest', 'Legs', 'Boots'];

    slots.forEach(slot => {
      const slotItems = items.filter(item => item.itemMetadata.type === slot);
      if (slotItems.length > 0) {
        const bestItem = slotItems.reduce((best, current) => {
          const currentScore = getItemCombatScore(current);
          const bestScore = getItemCombatScore(best);
          return currentScore > bestScore ? current : best;
        }, slotItems[0]);
        bestBySlot[slot] = bestItem;
      } else {
        bestBySlot[slot] = null;
      }
    });

    return bestBySlot;
  };

  const getItemCombatScore = (item) => {
    if (!item || !item.itemMetadata.effects) return 0;
    const power = parseInt(item.itemMetadata.effects.find(e => e.statType === 'Power')?.value || 0);
    const vitality = parseInt(item.itemMetadata.effects.find(e => e.statType === 'Vitality')?.value || 0);
    return power + vitality;
  };

  const calculateTotalStats = () => {
    const equipped = Object.values(equippedItems).filter(Boolean);
    const totalStats = {
      power: baseStats.power,
      vitality: baseStats.vitality,
      fortune: baseStats.fortune,
      luck: baseStats.luck
    };

    equipped.forEach(item => {
      item.itemMetadata.effects.forEach(effect => {
        const value = parseInt(effect.value);
        const stat = effect.statType.toLowerCase();
        totalStats[stat] += value;
      });
    });

    return totalStats;
  };

  const calculateCombatLevel = (power, vitality) => {
    // Calculate average of power and vitality
    const averageStats = (power + vitality) / 2;
    
    // Combat level is half of the average stats
    const combatLevel = Math.floor(averageStats / 2);
    
    return combatLevel;
  };

  const calculateSuccessChance = (dungeon) => {
    if (!dungeon) return 0;

    const calculatedStats = calculateTotalStats();
    const baseBossKillChance = parseFloat(dungeon.dungeonBossKillChance);
    const calculatedCombatLevel = calculateCombatLevel(calculatedStats.power, calculatedStats.vitality);
    const levelDifference = calculatedCombatLevel - dungeon.recommendedCombatLevel;
    
    // Start with base chance
    let adjustedChance = baseBossKillChance;

    // Define scaling factor for each dungeon
    const scalingFactors = {
      'ForgottenCrossroads': 0.0175, // 2% level for over recommended Forgotten Crossroads Combat Level
      'ThievesDen': 0.01,
      'AncientTombs': 0.0075,
      'FrostboundKeep': 0.005,
      'CrimsonHall': 0.00275 // 0.325% per level for over recommended Crimson Hall Combat Level
    };

    const scalingFactor = scalingFactors[dungeon.id] || 0.01; // Default to 1% if not specified

    // Apply level difference bonus/penalty
    if (levelDifference > 0) {
      // Apply scaling factor for level bonus
      adjustedChance += Math.min(0.25, (levelDifference * scalingFactor)); // Max 20% bonus from levels
    } else {
      // Being underleveled is more punishing
      adjustedChance += (levelDifference * 0.03); // 3% penalty per level below
    }

    // Apply diminishing returns for base stats
    const calculateBaseStatBonus = (stat, baseValue = 100, threshold = 200) => {
      const excessStat = Math.max(0, stat - baseValue);
      const baseBonusValue = Math.min(stat, baseValue) * 0.00018; // 0.018% per point up to base
      const excessBonusValue = Math.sqrt(excessStat) * 0.0007; // Diminishing returns after base
      const thresholdBonus = Math.max(0, stat - threshold) * 0.00004; // Stronger diminishing returns after 200
      return Math.min(0.015, baseBonusValue + excessBonusValue - thresholdBonus); // Cap at 1.4% bonus
    };

    // Apply diminishing returns for equipment stats
    const calculateEquipmentStatBonus = (stat, threshold = 200) => {
      const baseBonusValue = stat * 0.00009; // 0.009% per point
      const excessBonusValue = Math.sqrt(stat) * 0.00045; // Diminishing returns
      const thresholdBonus = Math.max(0, stat - threshold) * 0.00004; // Stronger diminishing returns after 200
      return Math.min(0.005, baseBonusValue + excessBonusValue - thresholdBonus); // Cap at 0.45% bonus
    };

    // Add power and vitality bonuses with diminishing returns
    const powerBonusValue = calculateBaseStatBonus(baseStats.power) + calculateEquipmentStatBonus(calculatedStats.power - baseStats.power);
    const vitalityBonusValue = calculateBaseStatBonus(baseStats.vitality) + calculateEquipmentStatBonus(calculatedStats.vitality - baseStats.vitality);
    
    adjustedChance += powerBonusValue;
    adjustedChance += vitalityBonusValue;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, adjustedChance));
  };

  const handleEquipItem = (item) => {
    setEquippedItems(prev => ({
      ...prev,
      [item.itemMetadata.type]: item
    }));
    onClose();
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    onOpen();
  };

  const getRarityColor = (rarity) => {
    const colors = {
      Common: 'gray',
      Uncommon: 'green',
      Rare: 'blue',
      Epic: 'purple',
      Mythic: 'orange',
      Legendary: 'yellow'
    };
    return colors[rarity] || 'gray';
  };

  const totalStats = calculateTotalStats();
  const combatLevel = calculateCombatLevel(totalStats.power, totalStats.vitality);

  const calculateDropChance = (baseChance, isEquipment = false) => {
    const totalStats = calculateTotalStats();
    const successChance = calculateSuccessChance(selectedDungeon);
    
    // Base chance is multiplied by success chance
    let adjustedChance = baseChance * successChance;
    
    // Apply fortune bonus with diminishing returns
    const fortuneBonus = Math.min(0.5, totalStats.fortune * 0.001); // Cap at 50% bonus
    adjustedChance *= (1 + fortuneBonus);
    
    // Apply luck bonus for equipment with diminishing returns
    if (isEquipment) {
      const luckBonus = Math.min(0.5, totalStats.luck * 0.001); // Cap at 50% bonus
      adjustedChance *= (1 + luckBonus);
    }
    
    return adjustedChance;
  };

  // Filter drops based on dungeon
  const getDungeonDrops = (dungeon) => {
    if (!dungeon) return [];
    
    // This should be replaced with actual dungeon-specific drop data
    // For now, we'll simulate different drops per dungeon
    const dungeonDrops = dropChances.filter(drop => {
      // Add logic to filter drops based on dungeon.id or other criteria
      // For example:
      if (dungeon.id === 'crimson_hall') {
        return true; // Show all drops for Crimson Hall
      }
      // Add conditions for other dungeons
      return false;
    });

    // Sort drops by rarity and type
    return dungeonDrops.sort((a, b) => {
      // Sort by rarity first
      const rarityOrder = {
        'Legendary': 0,
        'Mythic': 1,
        'Epic': 2,
        'Rare': 3,
        'Uncommon': 4,
        'Common': 5
      };
      
      const rarityDiff = rarityOrder[a.itemMetadata.rarity] - rarityOrder[b.itemMetadata.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      
      // Then sort by type
      return a.itemMetadata.type.localeCompare(b.itemMetadata.type);
    });
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <Card>
            <CardHeader>
              <Heading size="md">Base Stats</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Base Power</FormLabel>
                  <NumberInput
                    min={0}
                    value={baseStats.power}
                    onChange={(value) => setBaseStats(prev => ({ ...prev, power: parseInt(value) }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Base Vitality</FormLabel>
                  <NumberInput
                    min={0}
                    value={baseStats.vitality}
                    onChange={(value) => setBaseStats(prev => ({ ...prev, vitality: parseInt(value) }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Base Fortune</FormLabel>
                  <NumberInput
                    min={0}
                    value={baseStats.fortune}
                    onChange={(value) => setBaseStats(prev => ({ ...prev, fortune: parseInt(value) }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Base Luck</FormLabel>
                  <NumberInput
                    min={0}
                    value={baseStats.luck}
                    onChange={(value) => setBaseStats(prev => ({ ...prev, luck: parseInt(value) }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Combat Stats</Heading>
            </CardHeader>
            <CardBody>
              <StatGroup>
                <Stat>
                  <StatLabel>Combat Level</StatLabel>
                  <StatNumber>{combatLevel}</StatNumber>
                  <StatHelpText>Calculated from Power and Vitality</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Total Power</StatLabel>
                  <StatNumber>{totalStats.power}</StatNumber>
                  <StatHelpText>Base: {baseStats.power}</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Total Vitality</StatLabel>
                  <StatNumber>{totalStats.vitality}</StatNumber>
                  <StatHelpText>Base: {baseStats.vitality}</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Total Fortune</StatLabel>
                  <StatNumber>{totalStats.fortune}</StatNumber>
                  <StatHelpText>Base: {baseStats.fortune}</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Total Luck</StatLabel>
                  <StatNumber>{totalStats.luck}</StatNumber>
                  <StatHelpText>Base: {baseStats.luck}</StatHelpText>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>
        </Grid>

        <Card>
          <CardHeader>
            <Heading size="md">Equipment</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={2}>
              {Object.entries(equippedItems).map(([slot, item]) => (
                <HStack key={slot} justify="space-between">
                  <Text fontWeight="bold">{slot}:</Text>
                  {item ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSelectSlot(slot)}
                      size="sm"
                    >
                      <HStack>
                        <Image
                          src={item.itemMetadata.image}
                          alt={item.itemMetadata.name}
                          boxSize="24px"
                        />
                        <Text>{item.itemMetadata.name}</Text>
                        <Badge colorScheme={getRarityColor(item.itemMetadata.rarity)}>
                          {item.itemMetadata.rarity}
                        </Badge>
                      </HStack>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSelectSlot(slot)}
                    >
                      Select {slot}
                    </Button>
                  )}
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Dungeon Success Chances</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Dungeon</Th>
                  <Th>Boss</Th>
                  <Th>Recommended Level</Th>
                  <Th isNumeric>Success Chance</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dungeons.map((dungeon) => {
                  const successChance = calculateSuccessChance(dungeon);
                  const isSelected = selectedDungeon?.id === dungeon.id;
                  return (
                    <React.Fragment key={dungeon.id}>
                      <Tr 
                        cursor="pointer"
                        onClick={() => setSelectedDungeon(isSelected ? null : dungeon)}
                        bg={isSelected ? 'gray.100' : undefined}
                      >
                        <Td>
                          <HStack>
                            <Icon 
                              as={isSelected ? ChevronDownIcon : ChevronRightIcon} 
                              w={6} 
                              h={6}
                            />
                            <Text>{dungeon.name}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Image 
                              src={dungeon.bossImage} 
                              alt={dungeon.bossName}
                              boxSize="32px"
                              objectFit="cover"
                              borderRadius="full"
                            />
                            <Text>{dungeon.bossName}</Text>
                          </HStack>
                        </Td>
                        <Td>{dungeon.recommendedCombatLevel}</Td>
                        <Td isNumeric>{(successChance * 100).toFixed(1)}%</Td>
                      </Tr>
                      {isSelected && (
                        <Tr>
                          <Td colSpan={4} p={0}>
                            <Box bg="gray.50" p={4}>
                              <VStack align="stretch" spacing={4}>
                                <Heading size="sm">Possible Drops</Heading>
                                <SimpleGrid columns={4} spacing={4}>
                                  {getDungeonDrops(dungeon)
                                    .map((drop) => {
                                      const isEquipment = drop.itemMetadata.type !== "Special";
                                      const adjustedChance = calculateDropChance(drop.chance, isEquipment);
                                      return (
                                        <Box 
                                          key={`${drop.itemMetadata.id}-${drop.chance}`}
                                          p={2}
                                          borderWidth={1}
                                          borderRadius="md"
                                          bg="white"
                                        >
                                          <VStack>
                                            <Image 
                                              src={drop.itemMetadata.image} 
                                              alt={drop.itemMetadata.name}
                                              boxSize="48px"
                                              objectFit="cover"
                                            />
                                            <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                                              {drop.itemMetadata.name}
                                            </Text>
                                            <Badge colorScheme={getRarityColor(drop.itemMetadata.rarity)}>
                                              {drop.itemMetadata.rarity}
                                            </Badge>
                                            <Text fontSize="xs" color="gray.500">
                                              {drop.itemMetadata.type}
                                            </Text>
                                            <Tooltip 
                                              label={`Base: ${(drop.chance * 100).toFixed(4)}%
${isEquipment ? 'Equipment bonus from Luck' : 'Bonus from Fortune'}`}
                                              placement="top"
                                            >
                                              <Text fontSize="sm" color="gray.600">
                                                {(adjustedChance * 100).toFixed(4)}%
                                              </Text>
                                            </Tooltip>
                                          </VStack>
                                        </Box>
                                      );
                                    })}
                                </SimpleGrid>
                              </VStack>
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Equipment Selection Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Select {selectedSlot}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th>Level</Th>
                    <Th>Stats</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inventory
                    .filter(item => item.itemMetadata.type === selectedSlot)
                    .sort((a, b) => getItemCombatScore(b) - getItemCombatScore(a))
                    .map(item => (
                      <Tr key={item.id}>
                        <Td>
                          <HStack>
                            <Image
                              src={item.itemMetadata.image}
                              alt={item.itemMetadata.name}
                              boxSize="32px"
                            />
                            <VStack align="start" spacing={0}>
                              <Text>{item.itemMetadata.name}</Text>
                              <Badge colorScheme={getRarityColor(item.itemMetadata.rarity)}>
                                {item.itemMetadata.rarity}
                              </Badge>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>{item.itemMetadata.level}</Td>
                        <Td>
                          <Text fontSize="sm">
                            {item.itemMetadata.effects.map(effect => 
                              `${effect.statType}: ${effect.value}`
                            ).join(' | ')}
                          </Text>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleEquipItem(item)}
                          >
                            Equip
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}

export default DungeonCalculator; 