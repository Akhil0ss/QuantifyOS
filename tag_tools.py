"""
Script to add model compatibility tags to marketplace_catalog.json.
Classifies tools into model tiers and adds provider compatibility info.
"""
import json
import os

# Model tier definitions
TIERS = {
    # Tier 1: Basic text generation - works with any model including small local ones
    "basic": {
        "min_model": "Any (Ollama 7B+)",
        "providers": ["openai", "gemini", "ollama", "deepseek", "anthropic", "web"],
        "description": "Works with any AI model"
    },
    # Tier 2: Requires good reasoning - needs a mid-range model  
    "standard": {
        "min_model": "GPT-4o-mini / Gemini Flash / Llama3 8B",
        "providers": ["openai", "gemini", "ollama", "deepseek", "anthropic", "web"],
        "description": "Requires mid-range model or better"
    },
    # Tier 3: Complex reasoning, code generation, structured output
    "advanced": {
        "min_model": "GPT-4o / Gemini Pro / Llama3 70B",
        "providers": ["openai", "gemini", "ollama", "deepseek", "anthropic"],
        "description": "Requires advanced model for best results"
    }
}

# Classification rules based on tool type and category
def classify_tool(tool):
    cat = tool.get("category", "").lower()
    tool_type = tool.get("type", "").lower()
    desc = tool.get("description", "").lower()
    
    # Advanced: code generation, financial analysis, legal, security
    advanced_keywords = ["code", "sql", "security", "legal", "contract", "debug", "refactor", 
                         "architecture", "compliance", "audit", "penetration", "vulnerability",
                         "terraform", "kubernetes", "cicd", "ci/cd", "grammar", "docker"]
    advanced_categories = ["development", "devops", "security", "legal"]
    
    # Standard: analysis, writing, data processing
    standard_keywords = ["analyze", "generate", "predict", "optimize", "scrape", "crawl",
                         "financial", "market", "trading", "strategy", "research"]
    standard_categories = ["finance", "data", "sales", "hr"]
    
    # Check advanced first
    if cat in advanced_categories:
        return "advanced"
    for kw in advanced_keywords:
        if kw in desc:
            return "advanced"
    
    # Check standard
    if cat in standard_categories:
        return "standard"
    for kw in standard_keywords:
        if kw in desc:
            return "standard"
    
    # Default: basic
    return "basic"

# Load catalog
catalog_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                            "backend", "app", "services", "marketplace_catalog.json")
with open(catalog_path, "r", encoding="utf-8") as f:
    catalog = json.load(f)

# Enrich each item
for item in catalog:
    tier = classify_tool(item)
    tier_data = TIERS[tier]
    item["min_model"] = tier_data["min_model"]
    item["providers"] = tier_data["providers"]
    item["tier"] = tier

# Write back
with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=4, ensure_ascii=False)

# Stats
tier_counts = {"basic": 0, "standard": 0, "advanced": 0}
for item in catalog:
    tier_counts[item["tier"]] += 1

print(f"✅ Updated {len(catalog)} tools with model compatibility tags")
print(f"   Basic (any model): {tier_counts['basic']}")
print(f"   Standard (mid-range): {tier_counts['standard']}")
print(f"   Advanced (pro models): {tier_counts['advanced']}")
