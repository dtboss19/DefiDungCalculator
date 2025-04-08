// Utility functions to analyze and validate dungeon drops

export const analyzeDungeonDrops = (dungeons, dropChances) => {
  const analysis = {
    totalItems: dropChances.length,
    itemsByType: {},
    itemsByRarity: {},
    dungeonSpecificDrops: {},
    possibleIssues: []
  };

  // Analyze all available items
  dropChances.forEach(drop => {
    // Count by type
    if (!analysis.itemsByType[drop.itemMetadata.type]) {
      analysis.itemsByType[drop.itemMetadata.type] = [];
    }
    analysis.itemsByType[drop.itemMetadata.type].push(drop.itemMetadata.name);

    // Count by rarity
    if (!analysis.itemsByRarity[drop.itemMetadata.rarity]) {
      analysis.itemsByRarity[drop.itemMetadata.rarity] = [];
    }
    analysis.itemsByRarity[drop.itemMetadata.rarity].push(drop.itemMetadata.name);

    // Check for duplicate chances
    const duplicates = dropChances.filter(d => 
      d.itemMetadata.id === drop.itemMetadata.id && 
      d.chance !== drop.chance
    );
    if (duplicates.length > 0) {
      analysis.possibleIssues.push(`Item ${drop.itemMetadata.name} has multiple different drop chances`);
    }
  });

  // Analyze dungeon-specific drops
  dungeons.forEach(dungeon => {
    analysis.dungeonSpecificDrops[dungeon.id] = {
      name: dungeon.name,
      recommendedLevel: dungeon.recommendedCombatLevel,
      baseKillChance: dungeon.dungeonBossKillChance,
      drops: {
        expected: [], // Expected drops based on level/type
        actual: [], // Actual drops found in dropChances
        missing: [] // Expected but not found
      }
    };

    // Logic to determine expected drops based on dungeon level
    const dungeonLevel = dungeon.recommendedCombatLevel;
    const expectedRarities = getExpectedRaritiesForLevel(dungeonLevel);
    
    analysis.dungeonSpecificDrops[dungeon.id].expectedRarities = expectedRarities;
  });

  return analysis;
};

const getExpectedRaritiesForLevel = (level) => {
  // Define expected rarity tiers based on dungeon level
  if (level >= 100) { // Crimson Hall
    return ['Common', 'Uncommon', 'Rare', 'Epic', 'Mythic', 'Legendary'];
  } else if (level >= 80) { // Frostbound Keep
    return ['Common', 'Uncommon', 'Rare', 'Epic', 'Mythic'];
  } else if (level >= 60) { // Ancient Tombs
    return ['Common', 'Uncommon', 'Rare', 'Epic'];
  } else if (level >= 30) { // Thieves Den
    return ['Common', 'Uncommon', 'Rare'];
  } else { // Forgotten Grove
    return ['Common', 'Uncommon'];
  }
};

export const validateDropData = (dungeons, dropChances) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check for required data
  if (!dungeons || dungeons.length === 0) {
    validation.errors.push('No dungeon definitions found');
    validation.isValid = false;
  }

  if (!dropChances || dropChances.length === 0) {
    validation.errors.push('No drop chances found');
    validation.isValid = false;
  }

  // Validate drop chances
  dropChances.forEach(drop => {
    // Check for required fields
    if (!drop.itemMetadata) {
      validation.errors.push(`Drop missing itemMetadata`);
      validation.isValid = false;
      return;
    }

    // Validate chance value
    if (typeof drop.chance !== 'number' || drop.chance <= 0 || drop.chance > 1) {
      validation.errors.push(`Invalid drop chance for ${drop.itemMetadata.name}: ${drop.chance}`);
      validation.isValid = false;
    }

    // Check for duplicate entries
    const duplicates = dropChances.filter(d => 
      d.itemMetadata.id === drop.itemMetadata.id &&
      d !== drop
    );
    if (duplicates.length > 0) {
      validation.warnings.push(`Duplicate entries found for item ${drop.itemMetadata.name}`);
    }
  });

  return validation;
};

// Example usage:
/*
const analysis = analyzeDungeonDrops(dungeons, dropChances);
console.log('Drop Analysis:', analysis);

const validation = validateDropData(dungeons, dropChances);
if (!validation.isValid) {
  console.error('Drop data validation failed:', validation.errors);
}
*/ 