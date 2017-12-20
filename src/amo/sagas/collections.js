import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import {
  ADD_ADDON_TO_COLLECTION,
  FETCH_CURRENT_COLLECTION,
  FETCH_CURRENT_COLLECTION_PAGE,
  FETCH_USER_ADDON_COLLECTIONS,
  FETCH_USER_COLLECTIONS,
  abortFetchCurrentCollection,
  abortFetchUserAddonCollections,
  abortFetchUserCollections,
  loadCollectionAddons,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserAddonCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import * as api from 'amo/api/collections';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';

export function* fetchCurrentCollection({
  payload: {
    errorHandlerId,
    page,
    slug,
    user,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const { detail, addons } = yield all({
      detail: call(api.getCollectionDetail, {
        api: state.api,
        slug,
        user,
      }),
      addons: call(api.getCollectionAddons, {
        api: state.api,
        page,
        slug,
        user,
      }),
    });

    yield put(loadCurrentCollection({ addons, detail }));
  } catch (error) {
    log.warn(`Collection failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchCurrentCollectionPage({
  payload: {
    errorHandlerId,
    page,
    slug,
    user,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const addons = yield call(api.getCollectionAddons, {
      api: state.api,
      page,
      slug,
      user,
    });

    yield put(loadCurrentCollectionPage({ addons }));
  } catch (error) {
    log.warn(`Collection page failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchCurrentCollection());
  }
}

export function* fetchUserCollections({
  payload: { errorHandlerId, userId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const collections = yield call(api.getAllUserCollections, {
      api: state.api, user: userId,
    });

    yield put(loadUserCollections({ userId, collections }));
  } catch (error) {
    log.warn(`Failed to fetch user collections: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchUserCollections({ userId }));
  }
}

export function* fetchUserAddonCollections({
  payload: { addonId, errorHandlerId, userId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);
    // TODO: ultimately, we should query a single API endpoint to
    // fetch all user collections that an add-on belongs to.
    // https://github.com/mozilla/addons-server/issues/7167

    // Fetch all collections belonging to the user.
    const collectionResults = yield call(api.getAllUserCollections, {
      api: state.api,
      user: userId,
    });

    const collections = {};
    const addonCalls = {};

    // Fetch all add-ons for each of those collections.
    collectionResults.forEach((collection) => {
      collections[collection.id] = collection;
      addonCalls[collection.id] = call(api.getAllCollectionAddons, {
        api: state.api,
        slug: collection.slug,
        user: userId,
      });
    });

    const addonResults = yield all(addonCalls);

    // Make a list of collections that the add-on belongs to.
    const matchingCollections = [];
    Object.keys(addonResults).forEach((collectionId) => {
      addonResults[collectionId].forEach((result) => {
        if (result.addon.id === addonId) {
          matchingCollections.push(collections[collectionId]);
        }
      });
    });

    yield put(loadUserAddonCollections({
      addonId, userId, collections: matchingCollections,
    }));
  } catch (error) {
    log.warn(`Failed to fetch user add-on collections: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    yield put(abortFetchUserAddonCollections({ addonId, userId }));
  }
}

export function* addAddonToCollection({
  payload: { addonId, collectionSlug, errorHandlerId, notes, userId },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    yield call(api.addAddonToCollection, {
      addon: addonId,
      api: state.api,
      collection: collectionSlug,
      notes,
      user: userId,
    });

    const collectionAddons = yield call(api.getAllCollectionAddons, {
      api: state.api,
      slug: collectionSlug,
      user: userId,
    });

    yield put(loadCollectionAddons({
      collectionSlug, addons: collectionAddons,
    }));
  } catch (error) {
    log.warn(`Failed to add add-on to collection: ${error}`);
    yield put(errorHandler.createErrorAction(error));
    // TODO: figure out if we need this. Yes we do.
    // yield put(abortFetchUserCollections({ userId }));
  }
}

export default function* collectionsSaga() {
  yield takeLatest(FETCH_CURRENT_COLLECTION, fetchCurrentCollection);
  yield takeLatest(
    FETCH_CURRENT_COLLECTION_PAGE, fetchCurrentCollectionPage
  );
  yield takeLatest(
    FETCH_USER_ADDON_COLLECTIONS, fetchUserAddonCollections
  );
  yield takeLatest(FETCH_USER_COLLECTIONS, fetchUserCollections);
  yield takeLatest(ADD_ADDON_TO_COLLECTION, addAddonToCollection);
}
