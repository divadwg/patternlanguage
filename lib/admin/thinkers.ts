// Canonical-thinker library. Each entry is enough for Claude to recognize
// the author and draw on its training knowledge; `works` is a hint, not an
// exhaustive list.

export interface Thinker {
  id: string;
  name: string;
  years?: string;
  works: string[];
  blurb: string;
  /**
   * True when the thinker is the seed of this project — their patterns are
   * already in the graph, so we don't expose an "extract" button for them.
   */
  canonical?: boolean;
}

export const THINKERS: Thinker[] = [
  {
    id: "jane-jacobs",
    name: "Jane Jacobs",
    years: "1916–2006",
    works: [
      "The Death and Life of Great American Cities",
      "The Economy of Cities",
      "Cities and the Wealth of Nations",
    ],
    blurb:
      "Challenged modernist planning orthodoxy. Made the case for mixed-use, short blocks, aged buildings, dense concentrations, and streets watched by eyes from the buildings that line them.",
  },
  {
    id: "jan-gehl",
    name: "Jan Gehl",
    years: "1936–",
    works: ["Life Between Buildings", "Cities for People", "How to Study Public Life"],
    blurb:
      "Danish architect who documented how people actually behave in public space. Showed that optional and social activities only flourish when the physical conditions meet a low threshold.",
  },
  {
    id: "william-whyte",
    name: "William H. Whyte",
    years: "1917–1999",
    works: [
      "The Social Life of Small Urban Spaces",
      "City: Rediscovering the Center",
    ],
    blurb:
      "Observed people in plazas with time-lapse cameras. Found that what makes a plaza work is movable seating, sun, trees, water, food, and the presence of other people.",
  },
  {
    id: "kevin-lynch",
    name: "Kevin Lynch",
    years: "1918–1984",
    works: ["The Image of the City", "Good City Form", "What Time Is This Place?"],
    blurb:
      "Showed how people build mental maps of a city from five elements: paths, edges, districts, nodes, and landmarks. Argued good cities are legible, well-connected, and fit the ways we actually move through them.",
  },
  {
    id: "donald-appleyard",
    name: "Donald Appleyard",
    years: "1928–1982",
    works: ["Livable Streets"],
    blurb:
      "Documented how traffic volume changes the social life of a street — the heavier the traffic, the fewer the neighbors people know and the smaller their perceived home territory.",
  },
  {
    id: "allan-jacobs",
    name: "Allan B. Jacobs",
    years: "1928–",
    works: ["Great Streets", "Looking at Cities", "The Boulevard Book"],
    blurb:
      "Catalogued the physical qualities of the world's best streets — width, tree planting, building heights, continuous building frontage, craftsmanship in the details.",
  },
  {
    id: "oscar-newman",
    name: "Oscar Newman",
    years: "1935–2004",
    works: ["Defensible Space", "Creating Defensible Space"],
    blurb:
      "Linked physical layout to perceived ownership and safety. Small clusters with clear thresholds and shared surveillance invite residents to maintain their territory; anonymous modernist superblocks do not.",
  },
  {
    id: "yi-fu-tuan",
    name: "Yi-Fu Tuan",
    years: "1930–2022",
    works: ["Space and Place", "Topophilia", "Landscapes of Fear"],
    blurb:
      "Humanist geographer. Distinguished abstract space from lived place, and examined the bonds of affection (topophilia) that form between people and the settings of their daily life.",
  },
  {
    id: "edward-relph",
    name: "Edward Relph",
    years: "1944–",
    works: ["Place and Placelessness"],
    blurb:
      "Argued that modernity produces placelessness — standardized, uniform environments that lack the specificity and rootedness of real places, and that we can learn to resist by cultivating insideness.",
  },
  {
    id: "christopher-alexander",
    name: "Christopher Alexander",
    years: "1936–2022",
    works: [
      "A Pattern Language",
      "The Timeless Way of Building",
      "The Nature of Order",
    ],
    blurb:
      "Originated the pattern-language idea this project extends. All 253 of his patterns are already the seed of this graph.",
    canonical: true,
  },
  {
    id: "camillo-sitte",
    name: "Camillo Sitte",
    years: "1843–1903",
    works: ["City Planning According to Artistic Principles"],
    blurb:
      "Studied the plazas of medieval European towns. Showed that irregular, enclosed, asymmetrical squares feel alive in a way that the geometric plazas of the Baroque and the industrial era do not.",
  },
  {
    id: "andres-duany",
    name: "Andrés Duany & Elizabeth Plater-Zyberk",
    works: ["Suburban Nation", "The New Civic Art"],
    blurb:
      "Co-founders of the New Urbanism. Codified the Transect — a gradient of rural to urban — and the form-based code as alternatives to single-use zoning.",
  },
  {
    id: "charles-montgomery",
    name: "Charles Montgomery",
    works: ["Happy City"],
    blurb:
      "Synthesized psychology, behavioral economics, and urban design to ask what city forms make people happier. Patterns emerge around commute length, social contact, nearby nature, and scale.",
  },
  {
    id: "james-kunstler",
    name: "James Howard Kunstler",
    works: [
      "The Geography of Nowhere",
      "Home from Nowhere",
      "The City in Mind",
    ],
    blurb:
      "Polemical critic of post-war American suburbia. Catalogues what's missing — public realm, transit, local economy, craftsmanship, a sense of gathering — in terms that are easy to convert into patterns.",
  },
  {
    id: "ian-mcharg",
    name: "Ian McHarg",
    years: "1920–2001",
    works: ["Design with Nature"],
    blurb:
      "Ecological-planning pioneer. Argued for overlaying a site's hydrology, soils, vegetation, and wildlife onto the design brief so that development respects the land's native logic.",
  },
  {
    id: "lewis-mumford",
    name: "Lewis Mumford",
    years: "1895–1990",
    works: ["The City in History", "The Culture of Cities", "Technics and Civilization"],
    blurb:
      "Long-view historian of the city. Examined how the form of settlement has tracked the form of civilization — monastery, medieval town, baroque capital, industrial slum, megalopolis.",
  },
  {
    id: "joel-garreau",
    name: "Joel Garreau",
    years: "1948–",
    works: ["Edge City: Life on the New Frontier", "The Nine Nations of North America"],
    blurb:
      "Named and mapped the Edge City — the office-retail agglomerations that grew up at suburban freeway interchanges. Documented their unwritten rules of parking, density, and development, and asked whether they can ever mature into real places.",
  },
  {
    id: "mike-davis",
    name: "Mike Davis",
    years: "1946–2022",
    works: ["City of Quartz", "Ecology of Fear", "Planet of Slums"],
    blurb:
      "Radical historian of Los Angeles. Anatomized the fortress city — gated enclaves, privatized public space, bum-proof benches, and the militarization of policing — and how fear, real estate, and power shape urban form.",
  },
  {
    id: "fred-kent-pps",
    name: "Fred Kent & Project for Public Spaces",
    works: ["How to Turn a Place Around"],
    blurb:
      "Founded placemaking as an organized practice. Developed the 'Power of Ten' and 'Place Diagram' heuristics for evaluating whether a public space is accessible, comfortable, sociable, and full of uses and activities.",
  },
];

export function thinkerById(id: string): Thinker | undefined {
  return THINKERS.find((t) => t.id === id);
}
