import { H3Event } from "h3";
import type { Prices } from "~/types";

export const getCachedPrices = defineCachedFunction(
  async (event: H3Event) => {
    const config = useRuntimeConfig(event);

    try {
      const prices = await $fetch<{ xmr: Prices }>(
        `${config.public.apiServerSideBaseUrl || config.public.apiBaseUrl}/prices`,
        {
          retry: 1, // Limit retries to avoid infinite loops
          timeout: 5000, // 5 second timeout
        }
      );

      return prices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      // Return default/fallback prices to prevent crashes
      return {
        xmr: {
          usd: 0,
          eur: 0,
          gbp: 0,
          cad: 0,
          aud: 0,
          jpy: 0,
        }
      };
    }
  },
  {
    maxAge: 60 * 4,
    swr: true,
    getKey: () => `prices`,
  }
);
