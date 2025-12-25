// Default locations for all users except Nematullah
export const DEFAULT_LOCATIONS = [
    // Original Locations
    "Chevron",
    "Sabzi Mandi",
    "Translink China",
    "Metro China",
    "Capstan Station",
    "Edmonds China",
    "Surrey China",
    "Canadian Tire",
    "Rupert Station",
    "Lougheed Station",
    "UBC",
    "Warehouse",
    "Ashok sir's House",
    "Bradner's (Cold Storage)",
    "UBC (Apple)",
    "New Westminster Sky Train Station",
    "Burnaby Refinery Area 2",
    // New Locations
    "Kelowna",
    "Edmonton",
] as const;

// Locations specific to Nematullah
export const NEMATULLAH_LOCATIONS = [
    "Nematullah's House",
    "Humbers College Etobicoke Campus",
    "University of Toronto Scarborough",
    "Edward Diagnostic",
    "Ontario Tech University",
    "Bridlewood Mall",
    "Herat Bazaar",
    "Agincourt Professional Centre",
    "Langham Square Mall",
] as const;

// Home base locations for trip tracking
export const HOME_BASES: Record<string, string> = {
    "Nematullah": "Nematullah's House",
    "default": "Ashok sir's House",
};

// Helper function to get locations for a specific user
export const getLocationsForUser = (username: string): readonly string[] => {
    if (username === "Nematullah") {
        return NEMATULLAH_LOCATIONS;
    }
    return DEFAULT_LOCATIONS;
};

// Helper function to get home base for a specific user
export const getHomeBaseForUser = (username: string): string => {
    return HOME_BASES[username] || HOME_BASES["default"];
};

// Legacy export for backward compatibility
export const LOCATIONS = DEFAULT_LOCATIONS;

export type Location = typeof DEFAULT_LOCATIONS[number] | typeof NEMATULLAH_LOCATIONS[number];
