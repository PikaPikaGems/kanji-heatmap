import { createContext, useContext, useRef, type ReactNode } from "react";

export type JishoJapanese = { word?: string; reading: string };
export type JishoSense = {
    english_definitions: string[];
    parts_of_speech: string[];
    restrictions: string[];
};
export type JishoEntry = {
    slug: string;
    is_common: boolean;
    jlpt: string[];
    japanese: JishoJapanese[];
    senses: JishoSense[];
};
export type JishoApiResponse = {
    meta: { status: number };
    data: JishoEntry[];
};

class LRUCache<K, V> {
    private readonly capacity: number;
    private readonly cache = new Map<K, V>();

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            this.cache.delete(this.cache.keys().next().value as K);
        }
        this.cache.set(key, value);
    }
}

type JishoCacheRef = React.MutableRefObject<LRUCache<string, JishoApiResponse>>;

const JishoCacheContext = createContext<JishoCacheRef>({
    current: new LRUCache(100),
});

export const JishoCacheProvider = ({ children }: { children: ReactNode }) => {
    const cacheRef = useRef(new LRUCache<string, JishoApiResponse>(100));
    return (
        <JishoCacheContext.Provider value={cacheRef}>
            {children}
        </JishoCacheContext.Provider>
    );
};

export const useJishoCache = () => useContext(JishoCacheContext);
