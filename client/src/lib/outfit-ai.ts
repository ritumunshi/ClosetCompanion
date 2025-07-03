import type { ClothingItem, OutfitHistory } from "@shared/schema";

export interface OutfitSuggestionParams {
  occasion: string;
  weather: string;
  items: ClothingItem[];
  recentHistory: OutfitHistory[];
}

export interface OutfitSuggestion {
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  accessory?: ClothingItem;
}

export class OutfitAI {
  static suggestOutfit(params: OutfitSuggestionParams): {
    suggestion: OutfitSuggestion;
    confidenceScore: number;
  } {
    const { occasion, weather, items, recentHistory } = params;
    
    // Get recently worn items to avoid repetition
    const recentlyWornItems = new Set(
      recentHistory.flatMap(h => h.itemIds || [])
    );
    
    // Filter items based on criteria
    const filteredItems = items.filter(item => {
      const matchesOccasion = !item.occasions || item.occasions.includes(occasion);
      const matchesWeather = this.matchesWeather(item, weather);
      const notRecentlyWorn = !recentlyWornItems.has(item.id);
      
      return matchesOccasion && matchesWeather && notRecentlyWorn;
    });
    
    // Group by category
    const itemsByCategory = {
      tops: filteredItems.filter(item => item.category === 'tops'),
      bottoms: filteredItems.filter(item => item.category === 'bottoms'),
      shoes: filteredItems.filter(item => item.category === 'shoes'),
      accessories: filteredItems.filter(item => item.category === 'accessories')
    };
    
    // Select items using scoring
    const suggestion: OutfitSuggestion = {
      top: this.selectBestItem(itemsByCategory.tops, occasion, weather),
      bottom: this.selectBestItem(itemsByCategory.bottoms, occasion, weather),
      shoes: this.selectBestItem(itemsByCategory.shoes, occasion, weather),
      accessory: itemsByCategory.accessories.length > 0 ? 
        this.selectBestItem(itemsByCategory.accessories, occasion, weather) : undefined
    };
    
    // Calculate confidence score
    const availableItems = Object.values(suggestion).filter(Boolean).length;
    const baseScore = availableItems * 20;
    const weatherBonus = this.getWeatherBonus(suggestion, weather);
    const occasionBonus = this.getOccasionBonus(suggestion, occasion);
    
    const confidenceScore = Math.min(95, baseScore + weatherBonus + occasionBonus + Math.random() * 10);
    
    return { suggestion, confidenceScore: Math.round(confidenceScore) };
  }
  
  private static matchesWeather(item: ClothingItem, weather: string): boolean {
    if (!item.seasons || item.seasons.length === 0) return true;
    
    const weatherToSeasons: Record<string, string[]> = {
      'cold': ['winter', 'fall'],
      'warm': ['summer', 'spring'],
      'rainy': ['fall', 'winter'],
      'windy': ['fall', 'spring']
    };
    
    const appropriateSeasons = weatherToSeasons[weather] || [];
    return item.seasons.some(season => appropriateSeasons.includes(season));
  }
  
  private static selectBestItem(items: ClothingItem[], occasion: string, weather: string): ClothingItem | undefined {
    if (items.length === 0) return undefined;
    
    // Score items
    const scoredItems = items.map(item => ({
      item,
      score: this.scoreItem(item, occasion, weather)
    }));
    
    // Sort by score and select from top candidates
    scoredItems.sort((a, b) => b.score - a.score);
    const topCandidates = scoredItems.slice(0, Math.min(3, scoredItems.length));
    
    // Random selection from top candidates
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    return topCandidates[randomIndex].item;
  }
  
  private static scoreItem(item: ClothingItem, occasion: string, weather: string): number {
    let score = 0;
    
    // Season match bonus
    if (item.seasons && this.matchesWeather(item, weather)) {
      score += 10;
    }
    
    // Occasion match bonus
    if (item.occasions && item.occasions.includes(occasion)) {
      score += 10;
    }
    
    // Color bonus (neutral colors get higher scores)
    if (item.colors) {
      const neutralColors = ['black', 'white', 'gray', 'brown', 'navy'];
      const hasNeutral = item.colors.some(color => neutralColors.includes(color));
      if (hasNeutral) score += 5;
    }
    
    // Wear frequency bonus (less worn items get higher scores)
    const wearCount = item.wearCount || 0;
    score += Math.max(0, 10 - wearCount);
    
    // Recency bonus (items not worn recently get higher scores)
    if (item.lastWorn) {
      const daysSinceWorn = Math.floor((Date.now() - item.lastWorn.getTime()) / (1000 * 60 * 60 * 24));
      score += Math.min(10, daysSinceWorn);
    } else {
      score += 15; // Never worn bonus
    }
    
    return score;
  }
  
  private static getWeatherBonus(suggestion: OutfitSuggestion, weather: string): number {
    let bonus = 0;
    const items = Object.values(suggestion).filter(Boolean) as ClothingItem[];
    
    for (const item of items) {
      if (this.matchesWeather(item, weather)) {
        bonus += 5;
      }
    }
    
    return bonus;
  }
  
  private static getOccasionBonus(suggestion: OutfitSuggestion, occasion: string): number {
    let bonus = 0;
    const items = Object.values(suggestion).filter(Boolean) as ClothingItem[];
    
    for (const item of items) {
      if (item.occasions && item.occasions.includes(occasion)) {
        bonus += 5;
      }
    }
    
    return bonus;
  }
}
