export const LOCATIONS = [
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

] as const;

export type Location = typeof LOCATIONS[number];
