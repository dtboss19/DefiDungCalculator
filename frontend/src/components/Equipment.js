import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Grid,
  Button,
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
  FormControl,
  FormLabel,
  Input,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  IconButton,
  ButtonGroup,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Text,
  Flex,
  Spacer,
  HStack,
  StatGroup,
  Tooltip
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, StarIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';

const API_BASE_URL = 'http://localhost:5000';

const Equipment = () => {
  const [gear, setGear] = useState([]);
  const [baseStats, setBaseStats] = useState({
    power: 0,
    vitality: 0,
    fortune: 0,
    luck: 0
  });
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editedStats, setEditedStats] = useState({...baseStats});
  const [newGear, setNewGear] = useState({
    slot: 'weapon',
    name: '',
    rarity: 'grey',
    tier: 1,
    power: 0,
    vitality: 0,
    fortune: 0,
    luck: 0
  });
  const [editingGear, setEditingGear] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchGear();
    fetchBaseStats();
  }, []);

  const fetchBaseStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/base-stats`);
      if (!response.ok) throw new Error('Failed to fetch base stats');
      const data = await response.json();
      setBaseStats(data);
      setEditedStats(data);
    } catch (error) {
      console.error('Error fetching base stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch base stats',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const updateBaseStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/base-stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedStats),
      });

      if (!response.ok) throw new Error('Failed to update base stats');

      setBaseStats(editedStats);
      setIsEditingStats(false);
      
      toast({
        title: 'Success',
        description: 'Base stats updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating base stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to update base stats',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const fetchGear = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gear`);
      if (!response.ok) {
        throw new Error('Failed to fetch gear');
      }
      const data = await response.json();
      setGear(data);
    } catch (error) {
      console.error('Error fetching gear:', error);
      setGear([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/gear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGear),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add gear');
      }

      toast({
        title: 'Gear added successfully',
        status: 'success',
        duration: 3000,
      });
      fetchGear();
      setNewGear({
        slot: 'weapon',
        name: '',
        rarity: 'grey',
        tier: 1,
        power: 0,
        vitality: 0,
        fortune: 0,
        luck: 0
      });
    } catch (error) {
      toast({
        title: 'Error adding gear',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEdit = (item) => {
    setEditingGear({
      id: item.id,
      slot: item.slot,
      name: item.name,
      rarity: item.rarity,
      tier: item.tier,
      power: item.stats.power,
      vitality: item.stats.vitality,
      fortune: item.stats.fortune,
      luck: item.stats.luck
    });
    onOpen();
  };

  const handleUpdate = async () => {
    if (!editingGear || !editingGear.id) {
      toast({
        title: 'Error updating gear',
        description: 'Invalid gear data',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/gear/${editingGear.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingGear),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update gear');
      }

      toast({
        title: 'Gear updated successfully',
        status: 'success',
        duration: 3000,
      });
      fetchGear();
      onClose();
      setEditingGear(null);
    } catch (error) {
      toast({
        title: 'Error updating gear',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      toast({
        title: 'Error deleting gear',
        description: 'Invalid gear ID',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this gear?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/gear/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete gear');
      }

      toast({
        title: 'Gear deleted successfully',
        status: 'success',
        duration: 3000,
      });
      fetchGear();
    } catch (error) {
      toast({
        title: 'Error deleting gear',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleEquipToggle = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gear/${item.equipped ? 'unequip' : 'equip'}/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${item.equipped ? 'unequip' : 'equip'} gear`);
      }

      toast({
        title: `Gear ${item.equipped ? 'unequipped' : 'equipped'} successfully`,
        status: 'success',
        duration: 3000,
      });
      fetchGear();
    } catch (error) {
      toast({
        title: `Error ${item.equipped ? 'unequipping' : 'equipping'} gear`,
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const calculateTotalStats = () => {
    const equippedGear = gear.filter(item => item.equipped);
    return {
      power: baseStats.power + equippedGear.reduce((sum, item) => sum + item.stats.power, 0),
      vitality: baseStats.vitality + equippedGear.reduce((sum, item) => sum + item.stats.vitality, 0),
      fortune: baseStats.fortune + equippedGear.reduce((sum, item) => sum + item.stats.fortune, 0),
      luck: baseStats.luck + equippedGear.reduce((sum, item) => sum + item.stats.luck, 0)
    };
  };

  const getRarityColor = (rarity) => {
    const colors = {
      grey: 'gray',
      green: 'green',
      blue: 'blue',
      purple: 'purple',
      gold: 'yellow'
    };
    return colors[rarity] || 'gray';
  };

  const totalStats = calculateTotalStats();

  return (
    <Box>
      <Heading mb={6}>Equipment Manager</Heading>
      
      <Grid templateColumns="repeat(2, 1fr)" gap={6} mb={6}>
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Base Stats</Heading>
              {isEditingStats ? (
                <HStack>
                  <IconButton
                    icon={<CheckIcon />}
                    colorScheme="green"
                    size="sm"
                    onClick={updateBaseStats}
                    aria-label="Save stats"
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => {
                      setIsEditingStats(false);
                      setEditedStats({...baseStats});
                    }}
                    aria-label="Cancel editing"
                  />
                </HStack>
              ) : (
                <Tooltip label="Edit base stats">
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => setIsEditingStats(true)}
                    aria-label="Edit stats"
                  />
                </Tooltip>
              )}
            </HStack>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Power</StatLabel>
                {isEditingStats ? (
                  <NumberInput
                    value={editedStats.power}
                    onChange={(value) => setEditedStats({...editedStats, power: parseInt(value) || 0})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : (
                  <StatNumber>{baseStats.power}</StatNumber>
                )}
              </Stat>
              <Stat>
                <StatLabel>Vitality</StatLabel>
                {isEditingStats ? (
                  <NumberInput
                    value={editedStats.vitality}
                    onChange={(value) => setEditedStats({...editedStats, vitality: parseInt(value) || 0})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : (
                  <StatNumber>{baseStats.vitality}</StatNumber>
                )}
              </Stat>
              <Stat>
                <StatLabel>Fortune</StatLabel>
                {isEditingStats ? (
                  <NumberInput
                    value={editedStats.fortune}
                    onChange={(value) => setEditedStats({...editedStats, fortune: parseInt(value) || 0})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : (
                  <StatNumber>{baseStats.fortune}</StatNumber>
                )}
              </Stat>
              <Stat>
                <StatLabel>Luck</StatLabel>
                {isEditingStats ? (
                  <NumberInput
                    value={editedStats.luck}
                    onChange={(value) => setEditedStats({...editedStats, luck: parseInt(value) || 0})}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : (
                  <StatNumber>{baseStats.luck}</StatNumber>
                )}
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Total Stats</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Power</StatLabel>
                <StatNumber>{totalStats.power}</StatNumber>
                {totalStats.power > baseStats.power && (
                  <Text color="green.500" fontSize="sm">
                    +{totalStats.power - baseStats.power} from gear
                  </Text>
                )}
              </Stat>
              <Stat>
                <StatLabel>Vitality</StatLabel>
                <StatNumber>{totalStats.vitality}</StatNumber>
                {totalStats.vitality > baseStats.vitality && (
                  <Text color="green.500" fontSize="sm">
                    +{totalStats.vitality - baseStats.vitality} from gear
                  </Text>
                )}
              </Stat>
              <Stat>
                <StatLabel>Fortune</StatLabel>
                <StatNumber>{totalStats.fortune}</StatNumber>
                {totalStats.fortune > baseStats.fortune && (
                  <Text color="green.500" fontSize="sm">
                    +{totalStats.fortune - baseStats.fortune} from gear
                  </Text>
                )}
              </Stat>
              <Stat>
                <StatLabel>Luck</StatLabel>
                <StatNumber>{totalStats.luck}</StatNumber>
                {totalStats.luck > baseStats.luck && (
                  <Text color="green.500" fontSize="sm">
                    +{totalStats.luck - baseStats.luck} from gear
                  </Text>
                )}
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>
      </Grid>

      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Add New Gear</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Slot</FormLabel>
                  <Select
                    value={newGear.slot}
                    onChange={(e) => setNewGear({ ...newGear, slot: e.target.value })}
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="accessory">Accessory</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={newGear.name}
                    onChange={(e) => setNewGear({ ...newGear, name: e.target.value })}
                    placeholder="Enter gear name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Rarity</FormLabel>
                  <Select
                    value={newGear.rarity}
                    onChange={(e) => setNewGear({ ...newGear, rarity: e.target.value })}
                  >
                    <option value="grey">Grey</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="gold">Gold</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Tier</FormLabel>
                  <NumberInput
                    min={1}
                    max={5}
                    value={newGear.tier}
                    onChange={(value) => setNewGear({ ...newGear, tier: parseInt(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Power</FormLabel>
                  <NumberInput
                    min={0}
                    value={newGear.power}
                    onChange={(value) => setNewGear({ ...newGear, power: parseInt(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Vitality</FormLabel>
                  <NumberInput
                    min={0}
                    value={newGear.vitality}
                    onChange={(value) => setNewGear({ ...newGear, vitality: parseInt(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Fortune</FormLabel>
                  <NumberInput
                    min={0}
                    value={newGear.fortune}
                    onChange={(value) => setNewGear({ ...newGear, fortune: parseInt(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Luck</FormLabel>
                  <NumberInput
                    min={0}
                    value={newGear.luck}
                    onChange={(value) => setNewGear({ ...newGear, luck: parseInt(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <Button type="submit" colorScheme="blue" w="full">
                  Add Gear
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Gear Inventory</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Slot</Th>
                  <Th>Rarity</Th>
                  <Th>Tier</Th>
                  <Th>Stats</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {gear.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <Flex align="center">
                        {item.name}
                        {item.equipped && (
                          <Badge ml={2} colorScheme="green">
                            Equipped
                          </Badge>
                        )}
                      </Flex>
                    </Td>
                    <Td>{item.slot}</Td>
                    <Td>
                      <Badge colorScheme={getRarityColor(item.rarity)}>
                        {item.rarity}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        Tier {item.tier}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        PWR: {item.stats.power} | 
                        VIT: {item.stats.vitality} | 
                        FOR: {item.stats.fortune} | 
                        LCK: {item.stats.luck}
                      </Text>
                    </Td>
                    <Td>
                      <ButtonGroup size="sm" variant="ghost">
                        <Button
                          colorScheme={item.equipped ? 'red' : 'green'}
                          onClick={() => handleEquipToggle(item)}
                        >
                          {item.equipped ? 'Unequip' : 'Equip'}
                        </Button>
                        <IconButton
                          icon={<EditIcon />}
                          aria-label="Edit gear"
                          onClick={() => handleEdit(item)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          aria-label="Delete gear"
                          onClick={() => handleDelete(item.id)}
                          colorScheme="red"
                        />
                      </ButtonGroup>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </Grid>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Gear</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Slot</FormLabel>
                <Select
                  value={editingGear?.slot || 'weapon'}
                  onChange={(e) => setEditingGear({ ...editingGear, slot: e.target.value })}
                >
                  <option value="weapon">Weapon</option>
                  <option value="armor">Armor</option>
                  <option value="accessory">Accessory</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={editingGear?.name || ''}
                  onChange={(e) => setEditingGear({ ...editingGear, name: e.target.value })}
                  placeholder="Enter gear name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Rarity</FormLabel>
                <Select
                  value={editingGear?.rarity || 'grey'}
                  onChange={(e) => setEditingGear({ ...editingGear, rarity: e.target.value })}
                >
                  <option value="grey">Grey</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="gold">Gold</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tier</FormLabel>
                <NumberInput
                  min={1}
                  max={5}
                  value={editingGear?.tier || 1}
                  onChange={(value) => setEditingGear({ ...editingGear, tier: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Power</FormLabel>
                <NumberInput
                  min={0}
                  value={editingGear?.power || 0}
                  onChange={(value) => setEditingGear({ ...editingGear, power: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Vitality</FormLabel>
                <NumberInput
                  min={0}
                  value={editingGear?.vitality || 0}
                  onChange={(value) => setEditingGear({ ...editingGear, vitality: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Fortune</FormLabel>
                <NumberInput
                  min={0}
                  value={editingGear?.fortune || 0}
                  onChange={(value) => setEditingGear({ ...editingGear, fortune: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Luck</FormLabel>
                <NumberInput
                  min={0}
                  value={editingGear?.luck || 0}
                  onChange={(value) => setEditingGear({ ...editingGear, luck: parseInt(value) })}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdate}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Equipment; 