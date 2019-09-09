/* @flow */
import invariant from 'invariant';

import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { SET_CLIENT_APP } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { isTheme } from 'core/utils';
import type { SetClientAppAction } from 'core/actions';
import type {
  AddonType,
  ExternalAddonType,
  PartialExternalAddonType,
} from 'core/types/addons';

export const FETCH_HOME_DATA: 'FETCH_HOME_DATA' = 'FETCH_HOME_DATA';
export const LOAD_HOME_DATA: 'LOAD_HOME_DATA' = 'LOAD_HOME_DATA';

export type PrimaryHeroShelfExternalType = {|
  id: string,
  guid: string,
  homepage: string,
  name: string,
  type: string,
|};

type HeroGradientType = {|
  start: string,
  end: string,
|};

type BaseExternalPrimaryHeroShelfType = {|
  gradient: HeroGradientType,
  featured_image: string,
  description: string | null,
|};

type ExternalPrimaryHeroShelfWithAddonType = {|
  ...BaseExternalPrimaryHeroShelfType,
  addon: PartialExternalAddonType,
  external: void,
|};

type ExternalPrimaryHeroShelfWithExternalType = {|
  ...BaseExternalPrimaryHeroShelfType,
  addon: void,
  external: PrimaryHeroShelfExternalType,
|};

export type ExternalPrimaryHeroShelfType =
  | ExternalPrimaryHeroShelfWithAddonType
  | ExternalPrimaryHeroShelfWithExternalType;

type BasePrimaryHeroShelfType = {|
  gradient: HeroGradientType,
  featuredImage: string,
  description: string | null,
|};

type PrimaryHeroShelfWithAddonType = {|
  ...BasePrimaryHeroShelfType,
  addon: AddonType,
  external: void,
|};

type PrimaryHeroShelfWithExternalType = {|
  ...BasePrimaryHeroShelfType,
  addon: void,
  external: PrimaryHeroShelfExternalType,
|};

export type PrimaryHeroShelfType =
  | PrimaryHeroShelfWithAddonType
  | PrimaryHeroShelfWithExternalType;

export type HeroCallToActionType = {|
  url: string,
  text: string,
|};

export type SecondaryHeroModuleType = {|
  icon: string,
  description: string,
  cta: HeroCallToActionType | null,
|};

export type SecondaryHeroShelfType = {|
  headline: string,
  description: string,
  cta: HeroCallToActionType | null,
  modules: Array<SecondaryHeroModuleType>,
|};

export type ExternalHeroShelvesType = {|
  primary: ExternalPrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HeroShelvesType = {|
  primary: PrimaryHeroShelfType,
  secondary: SecondaryHeroShelfType,
|};

export type HomeState = {
  collections: Array<Object | null>,
  heroShelves: HeroShelvesType | null,
  resultsLoaded: boolean,
  shelves: { [shelfName: string]: Array<AddonType> | null },
};

export const initialState: HomeState = {
  collections: [],
  heroShelves: null,
  resultsLoaded: false,
  shelves: {},
};

type FetchHomeDataParams = {|
  collectionsToFetch: Array<Object>,
  enableFeatureRecommendedBadges: boolean,
  errorHandlerId: string,
  includeRecommendedThemes: boolean,
  includeTrendingExtensions: boolean,
|};

export type FetchHomeDataAction = {|
  type: typeof FETCH_HOME_DATA,
  payload: FetchHomeDataParams,
|};

export const fetchHomeData = ({
  collectionsToFetch,
  enableFeatureRecommendedBadges,
  errorHandlerId,
  includeRecommendedThemes,
  includeTrendingExtensions,
}: FetchHomeDataParams): FetchHomeDataAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(collectionsToFetch, 'collectionsToFetch is required');

  return {
    type: FETCH_HOME_DATA,
    payload: {
      collectionsToFetch,
      enableFeatureRecommendedBadges,
      errorHandlerId,
      includeRecommendedThemes,
      includeTrendingExtensions,
    },
  };
};

type ApiAddonsResponse = {|
  count: number,
  results: Array<ExternalAddonType>,
|};

type LoadHomeDataParams = {|
  collections: Array<Object | null>,
  heroShelves: ExternalHeroShelvesType,
  shelves: { [shelfName: string]: ApiAddonsResponse },
|};

type LoadHomeDataAction = {|
  type: typeof LOAD_HOME_DATA,
  payload: LoadHomeDataParams,
|};

export const loadHomeData = ({
  collections,
  heroShelves,
  shelves,
}: LoadHomeDataParams): LoadHomeDataAction => {
  invariant(collections, 'collections is required');
  invariant(shelves, 'shelves is required');

  return {
    type: LOAD_HOME_DATA,
    payload: {
      collections,
      heroShelves,
      shelves,
    },
  };
};

type Action = FetchHomeDataAction | LoadHomeDataAction | SetClientAppAction;

const createInternalAddons = (
  response: ApiAddonsResponse,
): Array<AddonType> => {
  return response.results.map((addon) => createInternalAddon(addon));
};

export const createInternalHeroShelves = (
  heroShelves: ExternalHeroShelvesType,
): HeroShelvesType => {
  const { primary, secondary } = heroShelves;

  invariant(
    primary.addon || primary.external,
    'Either primary.addon or primary.external is required',
  );

  let shelves;

  const basePrimaryShelf = {
    gradient: primary.gradient,
    featuredImage: primary.featured_image,
    description: primary.description,
  };

  if (primary.addon) {
    const primaryShelf: PrimaryHeroShelfWithAddonType = {
      ...basePrimaryShelf,
      addon: createInternalAddon(primary.addon),
      external: undefined,
    };

    shelves = {
      primary: primaryShelf,
      secondary,
    };
  } else {
    const primaryShelf: PrimaryHeroShelfWithExternalType = {
      ...basePrimaryShelf,
      addon: undefined,
      external: primary.external,
    };
    shelves = {
      primary: primaryShelf,
      secondary,
    };
  }

  return shelves;
};

const reducer = (
  state: HomeState = initialState,
  action: Action,
): HomeState => {
  switch (action.type) {
    case SET_CLIENT_APP:
      return initialState;

    case FETCH_HOME_DATA:
      return {
        ...state,
        resultsLoaded: false,
      };

    case LOAD_HOME_DATA: {
      const { collections, heroShelves, shelves } = action.payload;

      return {
        ...state,
        collections: collections.map((collection) => {
          if (collection && collection.results && collection.results.length) {
            const sliceEnd = isTheme(collection.results[0].addon.type)
              ? LANDING_PAGE_THEME_COUNT
              : LANDING_PAGE_EXTENSION_COUNT;
            return collection.results.slice(0, sliceEnd).map((item) => {
              return createInternalAddon(item.addon);
            });
          }
          return null;
        }),
        heroShelves: createInternalHeroShelves(heroShelves),
        resultsLoaded: true,
        shelves: Object.keys(shelves).reduce((shelvesToLoad, shelfName) => {
          const response = shelves[shelfName];

          return {
            ...shelvesToLoad,
            [shelfName]: response ? createInternalAddons(response) : null,
          };
        }, {}),
      };
    }

    default:
      return state;
  }
};

export default reducer;
