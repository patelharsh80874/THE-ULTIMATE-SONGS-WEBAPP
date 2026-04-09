import express from 'express';
import {
    getFeaturedStations,
    getArtistsRadios,
    createFeaturedStation,
    createArtistStation,
    getStationSongs,
    getTrending,
    getSearchStarring,
    getLabelData,
    createEntityStation,
    getSmartQueueSongs
} from '../controllers/radioController.js';

const router = express.Router();

router.get('/featured', getFeaturedStations);
router.get('/artists', getArtistsRadios);
router.get('/create-station', createFeaturedStation);
router.get('/create-artist-station', createArtistStation);
router.get('/station-songs', getStationSongs);
router.get('/trending', getTrending);
router.get('/starring', getSearchStarring);
router.get('/label', getLabelData);
router.get('/create-entity-station', createEntityStation);
router.get('/smart-queue-songs', getSmartQueueSongs);

export default router;
