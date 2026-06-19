export interface DreamSymbol {
  name: string;
  meaning: string;
}

export interface Suggestion {
  title: string;
  content: string;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  hostName: string;
}

export interface Dream {
  id: string;
  title: string;
  rawDescription: string;
  organizedDream: string | null;
  symbols: DreamSymbol[] | null;
  psychologyAnalysis: string | null;
  emotionAnalysis: string | null;
  suggestions: Suggestion[] | null;
  overallScore: number | null;
  moodTag: string | null;
  category: string | null;
  reportHtml: string | null;
  searchSources: SearchSource[] | null;
  createdAt: string;
  updatedAt: string;
}
