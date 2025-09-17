import { H3Event } from "h3";
import type { Coin } from "~/types";

export const getCachedCoins = defineCachedFunction(
  async (event: H3Event) => {
    const config = useRuntimeConfig(event);

    try {
      const res = await $fetch<{ coins: Coin[] }>(
        `${
          config.public.apiServerSideBaseUrl || config.public.apiBaseUrl
        }/swaps/coins`,
        {
          retry: 1, // Limit retries to avoid infinite loops
          timeout: 5000, // 5 second timeout
        }
      );

      const swapRes = await $fetch<{ minimum: number; maximum: number }>(
        `${
          config.public.apiServerSideBaseUrl || config.public.apiBaseUrl
        }/swaps/min-swap`,
        {
          retry: 1, // Limit retries to avoid infinite loops
          timeout: 5000, // 5 second timeout
        }
      );

      return {
        coins: res.coins,
        swapMinMax: swapRes,
      };
    } catch (error) {
      console.error('Failed to fetch coins data:', error);
      // Return default/fallback values to prevent crashes
      return {
        coins: [],
        swapMinMax: {
          minimum: 0,
          maximum: 0,
        }
      };
    }
  },
  {
    maxAge: 60 * 40, // 40 minutes
    swr: true,
    getKey: () => `swap-coins-and-swap-min-max`,
  }
);
